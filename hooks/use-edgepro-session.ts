"use client";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { sessionReducer } from "@/lib/session/reducer";
import { initialSessionState } from "@/lib/session/types";
import {
  parseServerMsg,
  encodeClientMsg,
  type ClientMsg,
} from "@/lib/ws/protocol";

type Options = {
  url?: string;
  models: { modelId: string; label: { en: string; ja: string } }[];
};

export function useEdgeproSession({
  url = "ws://localhost:8000/ws/session",
  models,
}: Options) {
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
  }, [url, models, send]);

  const stopRecording = useCallback(() => {
    send({ type: "stop" });
    dispatch({ type: "STOP" });
  }, [send]);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const sendAudioFrame = useCallback(
    (pcm: ArrayBuffer) => send({ type: "audio", pcm }),
    [send],
  );

  useEffect(
    () => () => {
      wsRef.current?.close();
    },
    [],
  );

  return { state, startRecording, stopRecording, sendAudioFrame, reset };
}
