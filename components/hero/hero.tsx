import { ReactNode } from "react";
import { AirGapPill } from "./air-gap-pill";

export function Hero({ cta }: { cta?: ReactNode }) {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 pt-32 pb-20">
      <div className="absolute top-6 right-6">
        <AirGapPill />
      </div>

      <div className="max-w-5xl text-center">
        <p className="text-sm tracking-[0.22em] uppercase mb-6 text-foreground-subtle">
          EdgePro · Hack the Liquid WAY · Track 2
        </p>

        <h1 className="text-7xl font-light leading-tight mb-4 text-foreground">
          Offline nursing-handover copilot
        </h1>

        <p
          className="text-5xl font-light text-foreground-muted"
          style={{ fontFamily: "var(--font-mincho)" }}
        >
          介護 申し送り、声から構造化へ。
        </p>

        <p className="mt-10 max-w-2xl mx-auto text-xl text-foreground-muted">
          A nurse speaks. A local LFM2.5-Audio-1.5B-JP fine-tuned for Japanese
          elderly care extracts the F-SOAIP facts.{" "}
          <span className="text-accent">No cloud.</span> No PII leaves the
          device.
        </p>

        {cta && <div className="mt-14 flex justify-center">{cta}</div>}
      </div>
    </section>
  );
}
