"use client";
import { useEdgeproSession } from "@/hooks/use-edgepro-session";
import { useMicCapture } from "@/hooks/use-mic-capture";
import { Hero } from "@/components/hero/hero";
import { MicButton } from "@/components/mic/mic-button";
import { Waveform } from "@/components/mic/waveform";
import { TranscriptBubble } from "@/components/workspace/transcript-bubble";
import { FsoaipCardGrid } from "@/components/workspace/fsoaip-card-grid";
import { StatsStrip, type Metric } from "@/components/workspace/stats-strip";
import wandbMetrics from "@/data/fixtures/wandb-metrics.json";

const MODELS = [
  { modelId: "base", label: { en: "LFM2.5-Audio base", ja: "ベース" } },
  {
    modelId: "edgepro",
    label: { en: "EdgePro fine-tuned", ja: "EdgePro 学習済み" },
  },
];
// To collapse to a single fine-tuned card (alt demo arc): keep only edgepro.

const METRICS: Metric[] = wandbMetrics;

export default function Page() {
  const { state, startRecording, stopRecording, sendAudioFrame } =
    useEdgeproSession({ models: MODELS });

  const mic = useMicCapture({ onFrame: sendAudioFrame });

  const press = async () => {
    startRecording();
    await mic.start();
  };
  const release = () => {
    mic.stop();
    stopRecording();
  };

  // Edgepro card auto-highlights (accent glow) when shown next to base
  const cards = state.cards.map((c) => ({
    ...c,
    highlighted: state.cards.length > 1 && c.modelId === "edgepro",
  }));

  return (
    <main>
      <Hero
        cta={
          <div className="flex flex-col items-center gap-4">
            <MicButton
              recording={mic.recording}
              disabled={state.phase === "streaming" || state.phase === "error"}
              onPress={press}
              onRelease={release}
            />
            <Waveform active={mic.recording} />
            {mic.error && (
              <p className="text-xs text-danger">Mic error: {mic.error}</p>
            )}
          </div>
        }
      />

      {(state.transcript || state.cards.length > 0 || state.errorMessage) && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          {state.errorMessage && (
            <div className="rounded-card border border-danger bg-danger-muted p-4 mb-6 text-sm">
              {state.errorMessage}
            </div>
          )}
          <TranscriptBubble text={state.transcript} />
          <FsoaipCardGrid cards={cards} />
          {state.cards.some((c) => c.complete) && (
            <StatsStrip metrics={METRICS} />
          )}
        </section>
      )}
    </main>
  );
}
