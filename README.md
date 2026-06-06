# EdgePro

> Offline 介護 申し送り (Japanese nursing-handover) copilot.
> Hack the Liquid WAY 2026 — Tokyo, Track 2 (LFM Audio / Fine-Tuning).

A nurse speaks a natural handover. A local LFM2.5-Audio-1.5B-JP fine-tune on an AMD Ryzen AI PC extracts the critical facts into structured **F-SOAIP JSON** (Focus / Subjective / Objective / Assessment / Intervention / Plan — the canonical 6-section JA care-record format). **No cloud — no PII ever leaves the device.**

![demo](docs/screenshot.png)

## Why

Japan's elderly-care sector is short-handed and spends real shift time typing 申し送り longhand. Voice-to-text could cut that by ~35%, but JP privacy law and facility rules forbid uploading patient medical audio. The only path is **edge AI**: a small audio LM that runs locally on the device, transcribes nothing externally, and emits the structured note inline.

Track 2 specifically rewards: ML technical depth, fine-tuning quality, dataset strategy, evaluation rigor, model improvement, **and the quality of the final audio demo**. This repo is the audio demo — the frontend a judge sees on stage.

## What's in this repo

A polished single-page Next.js app that:

- Captures mic audio in the browser (AudioWorklet → 16-bit PCM @ 16kHz).
- Streams PCM frames to a local FastAPI/llama.cpp server (or a Node mock that replays a canned F-SOAIP fixture, included).
- Renders **two F-SOAIP cards side-by-side** as JSON events stream in — `base` (LFM2.5-Audio out-of-the-box) and `edgepro` (the JA-care fine-tune). The fine-tuned card highlights with an accent glow; the base card stays muted. The improvement-over-base story is visible without narration.
- Bilingual JA/EN copy throughout. Single mincho moment for `申し送り` in the hero.
- Air-gap status pill — watches `navigator.onLine` and turns green when WiFi is off (the "disconnect on stage" flex).
- Two-step mic permission flow that handles browser permission prompts cleanly.

## Stack

- **Next.js 15.5** (App Router, Turbopack) + **React 18**
- **TypeScript** + strict mode
- **Tailwind v4** — `@theme` tokens in CSS, no `tailwind.config.ts`
- **shadcn/ui v4** + **Radix UI primitives**
- **Framer Motion**, **Zod**, **class-variance-authority**, **clsx + tailwind-merge**
- **vitest** + **@testing-library/react** + **jsdom** for unit tests
- **`ws`** + **`tsx`** for the mock backend

## Liquid Dark — design tokens

- **Background:** `#06070D` (deep ink, cooler than typical "dark mode")
- **Surface / elevated:** `#0F1118` / `#181B26`
- **Accent (Liquid water-blue):** `#3FB8E5`, with a `0 0 16px rgba(63,184,229,0.25)` glow on highlighted cards
- **High-energy moments:** `#67E8F9` (cyan, sparingly — waveform peaks, streaming caret)
- **State:** `#F97316` danger / `#10B981` success / `#FBBF24` warning / `#3B82F6` info
- **Type:** Inter sans + Noto Sans JP + JetBrains Mono (mono drawer) + Noto Serif JP (mincho, used once in the hero)

All tokens live in `app/globals.css` as Tailwind v4 `@theme` custom properties. See `docs/2026-06-06-edgepro-frontend-design.md` for the full design rationale.

## Demo it locally

```bash
pnpm install

# Terminal 1 — mock backend (replays an interleaved base+edgepro F-SOAIP fixture)
pnpm mock-server

# Terminal 2 — frontend
pnpm dev

# Browser
open http://localhost:3007
```

Then:

1. **First click** on the mic button = browser permission prompt; workspace stays hidden.
2. After **Allow**, button relabels to `🎙 Press & hold to speak`.
3. **Press and hold** for ~3 seconds, **release**. Transcript streams in JA; both F-SOAIP cards populate side-by-side.
4. Base card produces deliberately weaker output (generic objective, no fall-risk capture). EdgePro card produces structured action items.
5. After completion, hero relabels to `🎙 Press & hold for next entry`; a `🎙 Record another handover` button appears below the cards.

The mock fixture delivers 33 events (9 transcript chunks, 19 interleaved fsoaip_field events, 2 fact_highlights on edgepro-only, 2 fsoaip_completes). Replay takes ~4 seconds.

## Wiring up to a real LFM2-Audio backend

The frontend talks to whatever WebSocket sits at `ws://localhost:8000/ws/session` and speaks the protocol in `lib/ws/protocol.ts`:

**Client → Server**
```ts
{ type: 'start',  sampleRate: 16000, models: ['base', 'edgepro'] }
{ type: 'audio',  pcm: ArrayBuffer }              // 16-bit PCM little-endian, 20ms frames
{ type: 'stop' }
```

**Server → Client**
```ts
{ type: 'transcript_partial', text: string }
{ type: 'transcript_final',   text: string }
{ type: 'fsoaip_field',       modelId, field, valuePartial: string }
{ type: 'fsoaip_complete',    modelId, note: FsoaipNote }
{ type: 'fact_highlight',     modelId, fact: FactItem, matched: boolean }
{ type: 'error',              message: string }
```

A typical backend is a thin **FastAPI** wrapper around the **`liquid-audio`** runtime on the assigned AMD Ryzen AI PC — `liquid-audio` ships preinstalled on the hackathon hardware. The runtime accepts streamed PCM and emits the F-SOAIP JSON; the WebSocket layer just translates.

**Notes for the backend team:** stream `fsoaip_field.valuePartial` on **grapheme cluster boundaries**, not byte boundaries. Splitting Japanese mid-character renders as `�` until the next chunk lands.

## Project layout

```
app/                          Next App Router — single route at /
  globals.css                 Tailwind v4 @theme tokens (Liquid Dark)
  layout.tsx                  Bilingual font stack + root html lang=ja
  page.tsx                    Composition: <Hero/> + workspace section
components/
  hero/                       Hero + air-gap pill
  mic/                        MicButton + Waveform (AudioWorklet-driven)
  primitives/                 Button / Badge / Card / cn util
  workspace/                  FsoaipCardGrid, FsoaipCard, FieldRow, TranscriptBubble, HighRiskChip, StatsStrip
hooks/
  use-edgepro-session.ts      WebSocket connection + reducer dispatch
  use-mic-capture.ts          getUserMedia + AudioWorklet → PCM frames + RMS level
  use-online.ts               navigator.onLine via useSyncExternalStore
lib/
  fsoaip/types.ts             The F-SOAIP TypeScript contract
  session/reducer.ts          Pure reducer (TDD'd) that assembles streamed events into ModelOutput[]
  session/types.ts            ModelOutput, SessionState
  ws/protocol.ts              Zod schemas for ServerMsg + ClientMsg
  utils.ts                    cn() class-merger
public/
  worklets/pcm-worklet.js     AudioWorklet processor (PCM + RMS)
scripts/
  mock-ws-server.ts           Node WS server that replays the fixture
data/fixtures/
  mock-session.json           Interleaved base+edgepro F-SOAIP events
  wandb-metrics.json          W&B-exported eval deltas (unused in default render)
tests/
  unit/                       vitest specs — protocol, reducer, AirGapPill
docs/
  2026-06-06-edgepro-frontend-design.md            Locked decisions, visual system, WS contract
  2026-06-06-edgepro-frontend-implementation-plan.md   Milestone-by-milestone build plan
```

## Commands

```bash
pnpm dev          # dev server on :3007
pnpm build        # production build
pnpm start        # serve the production build on :3007
pnpm test         # vitest run (14 tests)
pnpm test:watch   # vitest watch
pnpm type-check   # tsc --noEmit
pnpm lint         # eslint (flat config)
pnpm mock-server  # mock WebSocket backend on :8000
```

## Honest engineering notes

- **W&B observability strip** (component + fixture) was built but the render is currently disabled in `app/page.tsx`. Re-enable by adding back the `<StatsStrip metrics={METRICS}/>` block + the JSON import. See `components/workspace/stats-strip.tsx`.
- **⚠ FALL / ⚠ FEVER chips** were built but the render is disabled too. `fact_highlight` events still populate `highRiskMatches` in state; rendering is a 3-line add-back inside `components/workspace/fsoaip-card.tsx`. See `components/workspace/high-risk-chip.tsx`.
- **AirGapPill SSR** uses `useSyncExternalStore` with a `null` server snapshot — server renders a neutral `Checking…` state and the client resolves after mount. No hydration mismatch.
- **MicButton press-and-hold** uses `onMouseDown`/`onMouseUp` plus `onMouseLeave` for "drag-off cancels recording" behavior. Touch handlers are wired for tablet demo.

## Acknowledgments

- **Liquid AI** — for LFM2.5-Audio-1.5B-JP and the Hack the Liquid WAY event.
- **AMD** — for the Ryzen AI PCs that run the inference layer.
- **Hugging Face** — for HF Jobs (where the fine-tune runs) and the model registry.
- **Weights & Biases** — for training + eval observability.

The 6-section F-SOAIP format is standard JA 介護・看護 record-keeping practice — not invented here.

## License

MIT. See `LICENSE`.
