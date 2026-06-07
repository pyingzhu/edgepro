import { ReactNode } from "react";
import { AirGapPill } from "./air-gap-pill";

export function Hero({ cta }: { cta?: ReactNode }) {
  return (
    <section className="relative min-h-[55vh] flex flex-col items-center justify-center px-6 pt-24 pb-8">
      <div className="absolute top-6 right-6">
        <AirGapPill />
      </div>

      <div className="max-w-5xl text-center">
        <p className="text-base tracking-[0.22em] uppercase mb-6 text-foreground-subtle">
          <span style={{ fontFamily: "var(--font-mincho)" }}>灯火</span>
          {" · "}Tomoshibi · Hack the Liquid WAY
        </p>

        <h1
          className="text-8xl font-light leading-tight mb-4 text-foreground"
          style={{ fontFamily: "var(--font-mincho)" }}
        >
          Offline nursing-handover copilot
        </h1>

        <p
          className="text-6xl font-light text-foreground-muted"
          style={{ fontFamily: "var(--font-mincho)" }}
        >
          介護 申し送り、声から構造化へ。
        </p>

        <p className="mt-8 max-w-3xl mx-auto text-2xl text-foreground-muted">
          A nurse speaks. A small audio LM, fine-tuned for Japanese elderly
          care, extracts the F-SOAIP facts.{" "}
          <span className="text-accent">No cloud.</span> No PII leaves the
          device.
        </p>

        {cta && <div className="mt-10 flex justify-center">{cta}</div>}
      </div>
    </section>
  );
}
