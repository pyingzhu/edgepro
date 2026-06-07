"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { pcmFramesToWavBlob } from "@/lib/hf-client";

type Options = { onFrame: (pcm: ArrayBuffer) => void; sampleRate?: number };

export type MicPermission = "unknown" | "prompt" | "granted" | "denied";

export function useMicCapture({ onFrame, sampleRate = 16000 }: Options) {
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const levelRef = useRef<number>(0); // 0..1 most recent RMS
  const recordedFramesRef = useRef<Int16Array[]>([]); // for HF flow — buffered locally
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<MicPermission>("unknown");

  // Query the Permissions API after mount — survives reloads / detects pre-grants.
  // setState in effect is intentional here: async one-shot load + subscription
  // setup, not reactive state. react-hooks/set-state-in-effect doesn't model
  // this pattern, so we disable it for this effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setPermission("prompt");
      return;
    }
    let active = true;
    let permRef: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (!active) return;
        permRef = status;
        setPermission(status.state as MicPermission);
        status.onchange = () => setPermission(status.state as MicPermission);
      })
      .catch(() => active && setPermission("prompt"));
    return () => {
      active = false;
      if (permRef) permRef.onchange = null;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Just request permission — does NOT begin streaming.
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPermission("denied");
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      recordedFramesRef.current = []; // fresh buffer per session
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate },
      });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate });
      ctxRef.current = ctx;
      await ctx.audioWorklet.addModule("/worklets/pcm-worklet.js");
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "pcm-worklet");
      node.port.onmessage = (
        e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>,
      ) => {
        levelRef.current = e.data.rms;
        // Keep a local copy for HF inference (the WS path consumes the
        // ArrayBuffer via send-as-transferable, so we slice before passing on).
        recordedFramesRef.current.push(new Int16Array(e.data.pcm.slice(0)));
        onFrame(e.data.pcm);
      };
      source.connect(node);
      // No output connection — we don't want feedback into speakers
      nodeRef.current = node;
      setRecording(true);
      setPermission("granted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      if (/^(NotAllowed|Permission)/i.test(msg)) setPermission("denied");
      throw err; // re-throw so caller can revert session phase
    }
  }, [onFrame, sampleRate]);

  /**
   * Return the recorded audio as a 16-bit mono WAV Blob.
   * Used by the HF inference path. Returns null if no frames captured.
   */
  const getRecordedBlob = useCallback((): Blob | null => {
    const frames = recordedFramesRef.current;
    if (frames.length === 0) return null;
    return pcmFramesToWavBlob(frames, sampleRate);
  }, [sampleRate]);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    nodeRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    levelRef.current = 0;
    setRecording(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    start,
    stop,
    recording,
    error,
    levelRef,
    permission,
    requestPermission,
    getRecordedBlob,
  };
}
