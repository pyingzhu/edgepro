"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = { onFrame: (pcm: ArrayBuffer) => void; sampleRate?: number };

export function useMicCapture({ onFrame, sampleRate = 16000 }: Options) {
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate },
      });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate });
      ctxRef.current = ctx;
      await ctx.audioWorklet.addModule("/worklets/pcm-worklet.js");
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "pcm-worklet");
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => onFrame(e.data);
      source.connect(node);
      // No output connection — we don't want feedback into speakers
      nodeRef.current = node;
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [onFrame, sampleRate]);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    nodeRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, recording, error };
}
