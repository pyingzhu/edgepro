"use client";
import { useEffect, useRef } from "react";

export function Waveform({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const bars = 24;
    let phase = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barWidth = width / bars - 4;
      for (let i = 0; i < bars; i++) {
        const t = phase + i * 0.3;
        const h = (Math.abs(Math.sin(t)) * 0.7 + 0.15) * height;
        const x = i * (barWidth + 4);
        const y = (height - h) / 2;
        ctx.fillStyle = `rgba(63, 184, 229, ${0.4 + Math.abs(Math.sin(t)) * 0.5})`;
        ctx.fillRect(x, y, barWidth, h);
      }
      phase += 0.15;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <canvas
      ref={ref}
      width={240}
      height={48}
      className="rounded transition-opacity duration-200"
      style={{ opacity: active ? 1 : 0.3 }}
    />
  );
}
