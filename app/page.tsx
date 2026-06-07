"use client";
import { useEdgeproSession } from "@/hooks/use-edgepro-session";
import { useMicCapture } from "@/hooks/use-mic-capture";
import { Hero } from "@/components/hero/hero";
import { MicButton } from "@/components/mic/mic-button";
import { Waveform } from "@/components/mic/waveform";
import { TranscriptBubble } from "@/components/workspace/transcript-bubble";
import { FsoaipCardGrid } from "@/components/workspace/fsoaip-card-grid";
import { Button } from "@/components/primitives/button";

const HF_URL = process.env.NEXT_PUBLIC_HF_INFERENCE_URL ?? "";
const IS_HF = Boolean(HF_URL);

// In HF mode, the Space returns a single F-SOAIP note — render one card.
// In WS/mock mode, render base + fine-tuned side-by-side.
const MODELS = IS_HF
  ? [
      {
        modelId: "edgepro",
        label: { en: "Tomoshibi · live", ja: "Tomoshibi · ライブ推論" },
      },
    ]
  : [
      { modelId: "base", label: { en: "LFM2.5-Audio base", ja: "ベース" } },
      {
        modelId: "edgepro",
        label: { en: "EdgePro fine-tuned", ja: "EdgePro 学習済み" },
      },
    ];

export default function Page() {
  const { state, mode, startRecording, stopRecording, sendAudioFrame, reset } =
    useEdgeproSession({ models: MODELS });

  const mic = useMicCapture({ onFrame: sendAudioFrame });

  // Single click — just request permission, don't start recording.
  const enable = async () => {
    await mic.requestPermission();
  };

  // Press & hold — only fires when permission is already granted.
  const press = async () => {
    // If a previous session is sitting on the page, clear before starting fresh.
    if (state.phase !== "idle") reset();
    try {
      await mic.start();
      startRecording();
    } catch {
      // mic.error is set by the hook; workspace stays hidden because START never dispatched.
    }
  };

  const release = async () => {
    // Snapshot the recorded audio BEFORE stop() tears down the worklet so the
    // HF path can POST the WAV blob. In WS mode, getRecordedBlob returns null
    // and stopRecording ignores it.
    const wavBlob = mode === "hf" ? mic.getRecordedBlob() : null;
    mic.stop();
    await stopRecording(wavBlob);
  };

  // Edgepro card auto-highlights (accent glow) when shown next to base
  const cards = state.cards.map((c) => ({
    ...c,
    highlighted: state.cards.length > 1 && c.modelId === "edgepro",
  }));

  const allComplete =
    state.cards.length > 0 && state.cards.every((c) => c.complete);

  const isDenied = mic.permission === "denied";

  return (
    <main>
      <Hero
        cta={
          <div className="flex flex-col items-center gap-4">
            <MicButton
              recording={mic.recording}
              permission={mic.permission}
              disabled={
                state.phase === "streaming" &&
                state.cards.some((c) => !c.complete)
              }
              hasPriorSession={state.cards.some((c) => c.complete)}
              onPress={press}
              onRelease={release}
              onEnable={enable}
            />
            <Waveform active={mic.recording} levelRef={mic.levelRef} />
            {mic.error && (
              <div className="text-center max-w-lg flex flex-col items-center gap-3">
                <p className="text-base text-danger">
                  {isDenied
                    ? "Microphone access denied. Click below to try again, or enable mic access in your browser settings and reload."
                    : `Mic error: ${mic.error}`}
                </p>
                {isDenied && (
                  <Button variant="outline" size="lg" onClick={enable}>
                    Allow microphone · マイクを許可
                  </Button>
                )}
              </div>
            )}
          </div>
        }
      />

      {(state.transcript || state.cards.length > 0 || state.errorMessage) && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          {state.errorMessage && (
            <div className="rounded-card border border-danger bg-danger-muted p-5 mb-8 text-base">
              {state.errorMessage === "WebSocket error"
                ? IS_HF
                  ? `HF Space at ${HF_URL} not reachable. Check the Space is awake and the URL is correct.`
                  : "Backend not reachable on ws://localhost:8000/ws/session. Start it with: pnpm mock-server"
                : state.errorMessage}
            </div>
          )}
          <TranscriptBubble text={state.transcript} />
          <FsoaipCardGrid cards={cards} />
          {allComplete && (
            <div className="mt-12 flex flex-col items-center gap-3">
              <Button
                size="xl"
                shape="pill"
                onClick={() => {
                  reset();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                🎙 Record another handover · 新しい申し送りを記録
              </Button>
              <p className="text-sm text-foreground-subtle">
                Or scroll up and press &amp; hold the mic
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
