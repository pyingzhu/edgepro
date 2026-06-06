"use client";
import { useEffect, useRef } from "react";

export function Waveform({
  active,
  levelRef,
}: {
  active: boolean;
  levelRef?: React.RefObject<number>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    if (!active) {
      historyRef.current = [];
      // clear canvas on deactivation
      const canvas = ref.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const bars = 24;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barWidth = width / bars - 4;

      // push latest level (or fall back to a small synthetic sway if no level)
      const level = levelRef?.current ?? 0;
      // amplify slightly — typical speech RMS sits around 0.05-0.2
      const scaled = Math.min(1, level * 4);
      historyRef.current.push(scaled);
      if (historyRef.current.length > bars) historyRef.current.shift();
      while (historyRef.current.length < bars) historyRef.current.unshift(0);

      for (let i = 0; i < bars; i++) {
        const v = historyRef.current[i] ?? 0;
        const h = Math.max(0.05, v * 0.85) * height;
        const x = i * (barWidth + 4);
        const y = (height - h) / 2;
        ctx.fillStyle = `rgba(63, 184, 229, ${0.4 + v * 0.5})`;
        ctx.fillRect(x, y, barWidth, h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, levelRef]);

  return (
    <canvas
      ref={ref}
      width={320}
      height={64}
      className="rounded transition-opacity duration-200"
      style={{ opacity: active ? 1 : 0.3 }}
    />
  );
}
