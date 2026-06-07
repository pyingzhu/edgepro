"use client";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { sessionReducer } from "@/lib/session/reducer";
import { initialSessionState } from "@/lib/session/types";
import {
  parseServerMsg,
  encodeClientMsg,
  type ClientMsg,
} from "@/lib/ws/protocol";
import { inferViaHf, hfResponseToNote } from "@/lib/hf-client";

type Model = { modelId: string; label: { en: string; ja: string } };

type Options = {
  url?: string;
  /** When set, switches inference from local WebSocket to the HF Space. */
  hfUrl?: string;
  models: Model[];
};

export type SessionMode = "ws" | "hf";

export function useEdgeproSession({
  url = "ws://localhost:8000/ws/session",
  hfUrl = process.env.NEXT_PUBLIC_HF_INFERENCE_URL ?? "",
  models,
}: Options) {
  const mode: SessionMode = hfUrl ? "hf" : "ws";
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const wsRef = useRef<WebSocket | null>(null);

  const send = useCallback((msg: ClientMsg) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const payload = encodeClientMsg(msg);
    if (typeof payload === "string") {
      ws.send(payload);
    } else {
      ws.send(payload);
    }
  }, []);

  const startRecording = useCallback(() => {
    dispatch({ type: "START", models });
    if (mode === "hf") return; // HF path waits for the WAV blob on release
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;
    ws.onopen = () => {
      send({
        type: "start",
        sampleRate: 16000,
        models: models.map((m) => m.modelId),
      });
    };
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return;
      try {
        const msg = parseServerMsg(JSON.parse(e.data));
        dispatch({ type: "SERVER", msg });
      } catch (err) {
        dispatch({
          type: "SERVER",
          msg: {
            type: "error",
            message: `protocol: ${(err as Error).message}`,
          },
        });
      }
    };
    ws.onerror = () => {
      dispatch({
        type: "SERVER",
        msg: { type: "error", message: "WebSocket error" },
      });
    };
    ws.onclose = () => {
      wsRef.current = null;
    };
  }, [mode, url, models, send]);

  const stopRecording = useCallback(
    async (wavBlob?: Blob | null) => {
      dispatch({ type: "STOP" });

      if (mode === "ws") {
        send({ type: "stop" });
        return;
      }

      // HF mode — POST the recorded WAV to the Space, synthesize a complete event.
      if (!wavBlob) {
        dispatch({
          type: "SERVER",
          msg: {
            type: "error",
            message: "No audio captured. Hold the mic for at least one second.",
          },
        });
        return;
      }
      try {
        const response = await inferViaHf(hfUrl, wavBlob);
        if (response.transcript) {
          dispatch({
            type: "SERVER",
            msg: { type: "transcript_final", text: response.transcript },
          });
        }
        const note = hfResponseToNote(response);
        const targetModelId =
          models.find((m) => m.modelId === "edgepro")?.modelId ??
          models[0]?.modelId ??
          "edgepro";
        dispatch({
          type: "SERVER",
          msg: { type: "fsoaip_complete", modelId: targetModelId, note },
        });
      } catch (err) {
        dispatch({
          type: "SERVER",
          msg: {
            type: "error",
            message: `HF inference failed: ${(err as Error).message}`,
          },
        });
      }
    },
    [mode, hfUrl, models, send],
  );

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const sendAudioFrame = useCallback(
    (pcm: ArrayBuffer) => {
      if (mode === "ws") send({ type: "audio", pcm });
      // HF mode buffers audio inside useMicCapture; nothing to do here.
    },
    [mode, send],
  );

  useEffect(
    () => () => {
      wsRef.current?.close();
    },
    [],
  );

  return { state, mode, startRecording, stopRecording, sendAudioFrame, reset };
}
