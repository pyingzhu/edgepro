# EdgePro frontend — design

**Status:** approved — ready for implementation plan
**Date:** 2026-06-06 (Day 1 of Hack the Liquid WAY hackathon, Tokyo)
**Linear:** this project — EdgePro offline LFM2-Audio nursing-handoff copilot (Hackathon Track 2)
**Parent:** the parent platform — Platform: Rensei → human-validated data & eval service for AI labs
**Scope:** frontend only. Demo strategy (what's shown on stage, in what order) is a separate brainstorm.

## Context

EdgePro is a 100% offline 介護 申し送り (Japanese elderly-care nursing handoff) copilot. A nurse speaks a natural handover; a local LFM2.5-Audio-1.5B-JP model on an AMD Ryzen AI PC extracts the critical facts into F-SOAIP JSON. No cloud — JP PII and facility rules forbid uploading patient audio.

The fine-tune + eval + offline runtime are out of scope for this document. This document specifies the **judge-facing frontend** that captures mic audio, streams it to a local inference server over WebSocket, and renders the resulting F-SOAIP card(s).

## Hard constraints (from the Liquid hackathon event guide)

- **Submission deadline:** Sun 2026-06-07, 13:30 JST. ~24 hours of dev runway from approval of this doc.
- **Live demo:** 5 minutes per team, 14:00–16:00 JST, on an assigned AMD Ryzen AI PC.
- **Track 2 required deliverables that the frontend must support:**
  - Measurable improvement over base (the UI must be able to render base + fine-tuned outputs in parallel — capability, not mandatory at runtime).
  - Audio demo (live speech-in/speech-out is the format we're targeting).
- **AMD Ryzen AI PC** ships with `liquid-audio` runtime preinstalled. The backend is a thin FastAPI wrapper around it exposing a WebSocket on `localhost:8000` — separately authored, not part of this frontend.

## Locked decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Tech stack:** Next.js 15.5 (App Router) + React 18 + Tailwind v4 + shadcn/ui v4 + Radix UI primitives + Zod + clsx + tailwind-merge. Tests: vitest + @testing-library/react + jsdom. No next-intl (single page; bilingual via inline strings), no auth, no Drizzle, no TanStack Query. | Matches `the parent app` `package.json` on `the design-language branch`. Air-gapped same-machine means no REST/auth/i18n routing layers needed. |
| 2 | **Location:** `./` inside the existing pnpm/turbo monorepo. | Matches user's monorepo conventions. |
| 3 | **Design system: "Liquid Dark"** — bespoke EdgePro palette structured on rensei's Tailwind v4 `@theme` pattern in `app/globals.css`. Deep-ink BG + Liquid water-blue accent. NOT lifted from rensei colors. | Rensei is light-mode "Kinari/Warm Studio" (eggshell, sumi ink, refined indigo) — clashes with on-stage projector reality and doesn't say "Liquid AI product." Liquid Dark says "built on Liquid AI" without copying their brand. Detail in "Visual system" section below. |
| 4 | **F-SOAIP schema:** mirrors `the F-SOAIP TypeScript contract` on `the F-SOAIP contract branch`. `error_cards` strictly excluded from frontend payload (contract invariant). | Schema is already locked across the platform; the demo must conform, not invent. |
| 5 | **Transport:** WebSocket on `ws://localhost:8000/ws/session`. Browser sends 16-bit PCM frames; server streams JSON events back. Latency tolerated. | User locked streaming (b) with delay accepted. Same-machine air-gapped — no TLS, no auth. |
| 6 | **Bilingual:** JA-first content (transcript, F-SOAIP body), EN sub-labels on structural chrome (`Focus / フォーカス` style). Hero has one mincho/serif JA poetic moment (`申し送り`). | Stage demo is primarily JA but judges include EN speakers. Single mincho moment honors the "one poetic moment per surface" convention from the rensei Blossom design system without copying its color palette. |
| 7 | **Single page, single route `/`.** No marketing site, no `/demo` split, no `/about`. | 24h timeline. One polished surface > two half-baked ones. |

## App shape

One page, two stacked zones:

### Hero zone (~60vh)
- Rensei-dark surface (`bg-background` = `#0A0A0B`).
- Bilingual headline (EN ≥ JA) + 1-line subhead.
- Air-gap status pill (top-right): `● Online` (red) / `● Air-gapped` (green) — driven by `navigator.onLine`.
- One primary CTA: large indigo-glow mic button.

### Workspace zone
- Live transcript bubble at top (streams JA text as it arrives).
- **Card grid** below: renders 1..N F-SOAIP cards in parallel. `props.cards: ModelOutput[]`. Runtime decides whether 1 or 2 (or more) cards render — not a build-time choice. Default: 1 card (fine-tuned only).
- Optional stats strip at bottom: horizontal row of W&B-exported metric deltas (held-out eval). Component built, hidden by default; `props.metrics` enables it.

## Component inventory

```
components/
  hero/
    hero.tsx                  — headline, subhead, CTA slot, status pill slot
    air-gap-pill.tsx          — navigator.onLine watcher → green/red pill
  mic/
    mic-button.tsx            — press-and-hold (default) or click-to-toggle; emits start/stop events
    waveform.tsx              — live audio-level bars while recording (canvas, AudioWorklet)
  workspace/
    transcript-bubble.tsx     — appends streamed JA text
    fsoaip-card.tsx           — renders one FsoaipNote (6 fields + high-risk badges + label)
    fsoaip-card-grid.tsx      — renders N cards side-by-side; takes `cards: ModelOutput[]`
    high-risk-chip.tsx        — ⚠ FALL / ⚠ FEVER / ⚠ VITAL chips from matched FactItems
    field-row.tsx             — one F-SOAIP field row w/ EN+JA label + streamed content
    stats-strip.tsx           — optional horizontal metric-delta row
  primitives/
    button.tsx, badge.tsx, card.tsx, kbd.tsx
```

All components are presentational (props in, JSX out). The only stateful module is `hooks/use-edgepro-session.ts`.

## State management

```
hooks/
  use-edgepro-session.ts      — owns the WS connection + session reducer
                                emits: { transcript, cards: ModelOutput[], state: 'idle'|'recording'|'streaming'|'done'|'error' }
  use-mic-capture.ts          — MediaRecorder + AudioWorklet → 16-bit PCM 16kHz frames (Float32Array → Int16Array)
  use-online.ts               — wraps navigator.onLine + online/offline events
```

`ModelOutput` shape (frontend-internal):

```ts
type ModelOutput = {
  modelId: 'base' | 'edgepro' | string;
  label: { en: string; ja: string };           // e.g. { en: 'EdgePro fine-tuned', ja: 'EdgePro 学習済み' }
  note: Partial<FsoaipNote>;                   // populated incrementally from `fsoaip_field` events
  highRiskMatches: { fact: FactItem; matched: boolean }[];
  complete: boolean;                           // flips true on `fsoaip_complete`
  highlighted?: boolean;                       // optional accent-glow CSS variant
};
```

Reducer assembles `valuePartial` chunks into the right `modelId` + `field` bucket. Card grid maps `ModelOutput[]` → `FsoaipCard` components.

## Visual system — Liquid Dark

Bespoke EdgePro palette structured on rensei's Tailwind v4 `@theme` pattern in `app/globals.css`. All tokens defined as CSS custom properties inside `@theme { ... }` — no `tailwind.config.ts` (Tailwind v4 reads config from CSS).

### Surfaces (deep water + ink)
- `--color-background: #06070D` — deep ink, cooler than Rensei's `#0A0A0B`. Reads as "deep water" under stage projector.
- `--color-surface: #0F1118` — cards, panels.
- `--color-surface-elevated: #181B26` — modals, popovers, highlighted card edge.
- `--color-border: #252836` — hairline dividers.
- `--color-border-subtle: #1A1D28` — even quieter dividers.

### Primary accent (Liquid water-blue)
- `--color-accent: #3FB8E5` — Liquid droplet hue (best-read approximation; replace if a brand kit becomes available — see Risks).
- `--color-accent-hover: #62C9EC`.
- `--color-accent-muted: rgba(63, 184, 229, 0.15)` — wash background for active states.
- `--shadow-glow-accent: 0 0 16px rgba(63, 184, 229, 0.25)` — used on recording mic ring and highlighted card.

### High-energy moments
- `--color-energy: #67E8F9` — bright cyan. Reserved for: live waveform peaks, `fact_highlight` pulse, `fsoaip_field` streaming tick animation. Used sparingly.

### State colors
- `--color-danger: #F97316` — warm orange (high-risk chips: ⚠ FALL, ⚠ FEVER). Calmer than blood red, still attention-grabbing on stage.
- `--color-success: #10B981` — teal-green. Sits in the blue family — no clash.
- `--color-warning: #FBBF24` — amber. Rare; for "model unsure" badges if surfaced.
- `--color-info: #3B82F6` — sky blue. Reserved for neutral chrome (online-status indicator etc.).

Each state color has a `*-muted` variant at 0.15 alpha for soft background washes.

### Type
- `--font-sans: var(--font-inter), 'Inter', var(--font-noto-jp), 'Noto Sans JP', system-ui, sans-serif`.
- `--font-mono: var(--font-jb-mono), 'JetBrains Mono', Menlo, monospace`.
- `--font-mincho: var(--font-noto-serif-jp), 'Noto Serif JP', 'Hiragino Mincho ProN', serif` — used ONCE: hero kanji `申し送り` companion to the EN headline, weight 200, low-contrast paper-grey color. "Single poetic moment per surface" rule from rensei's Blossom convention.
- **Base 14px** for data density on cards. **16px+** for hero.

### Radii & shadows
- `--radius-card: 12px`, `--radius-button: 8px`, `--radius-pill: 9999px` (air-gap status pill).
- `--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)` — heavier than Rensei (deeper BG demands stronger card edge).
- `--shadow-elevated: 0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)`.
- `--shadow-glow-accent` (see above).

### Animations (200–300ms ease-out)
- `fade-in` 200ms.
- `fade-up` 300ms (cards appearing).
- `slide-in-right` 200ms (streamed transcript chunks).
- `scale-in` 200ms (mic button activation).
- `pulse-glow` 1.2s infinite ease-in-out — recording mic button's outer ring; uses `--shadow-glow-accent`.

### Component variants
- **Highlighted card** (e.g. fine-tuned EdgePro card when shown alongside base): `border: 1px solid var(--color-accent); box-shadow: var(--shadow-glow-accent);`. Pure CSS modifier on `<FsoaipCard variant="highlighted">`.
- **Muted card** (e.g. base model card for contrast): standard surface, no glow, slightly lower text opacity (`opacity: 0.85`). Pure CSS modifier on `<FsoaipCard variant="muted">`.

## WebSocket protocol (frontend ↔ backend contract)

Endpoint: `ws://localhost:8000/ws/session`

### Client → server

```ts
type ClientMsg =
  | { type: 'start'; sampleRate: 16000; models: Array<'base' | 'edgepro'> }
  | { type: 'audio'; pcm: ArrayBuffer }   // 16-bit PCM little-endian, 20ms frames
  | { type: 'stop' };
```

### Server → client

```ts
type ServerMsg =
  | { type: 'transcript_partial'; text: string }
  | { type: 'transcript_final'; text: string }
  | { type: 'fsoaip_field';     modelId: string; field: FsoaipField; valuePartial: string }
  | { type: 'fsoaip_complete';  modelId: string; note: FsoaipNote }
  | { type: 'fact_highlight';   modelId: string; fact: FactItem; matched: boolean }
  | { type: 'error';            message: string };
```

`FsoaipNote`, `FsoaipField`, `FactItem` imported from `lib/fsoaip/types.ts` (mirror of the Rensei contract).

### Notes for the backend team

- Stream `fsoaip_field.valuePartial` on **grapheme cluster boundaries**, not byte boundaries. Splitting Japanese mid-character will render as `�` until the next chunk lands.
- No reconnect logic on the client — air-gapped same-machine, assumed reliable.
- No backpressure: at 16kHz × 16-bit, uplink is ~32 KB/s — trivial for `localhost`.
- `modelId` is opaque to the client (typed loosely as `string`). Server can send any label; client renders whatever cards the user spec'd in `start.models`.

## File layout

```
./
  package.json                — name: "edgepro" (or "edgepro"); deps mirror rensei minus auth/intl/drizzle
  next.config.js              — minimal: reactStrictMode, output: 'standalone', outputFileTracingRoot
  postcss.config.js           — @tailwindcss/postcss only
  tsconfig.json               — copied from rensei pattern
  components.json             — shadcn config (style: default, baseColor: neutral, cssVariables: true)
  vitest.config.ts            — vitest + jsdom + @vitejs/plugin-react
  app/
    layout.tsx                — fonts via next/font (Inter, Noto Sans JP, Noto Serif JP, JetBrains Mono); <html lang="ja" className="dark">; metadata
    page.tsx                  — composes <Hero /> + <Workspace />
    globals.css               — @import "tailwindcss"; @theme { ...Liquid Dark tokens }; keyframes; component utilities
  components/                 — see "Component inventory" above
  hooks/
    use-edgepro-session.ts    — owns WS + reducer
    use-mic-capture.ts        — MediaRecorder + AudioWorklet → 16-bit PCM frames
    use-online.ts             — navigator.onLine watcher
  lib/
    fsoaip/
      types.ts                — copied verbatim from the F-SOAIP TypeScript contract (SHA pinned, branch: fur-166-fsoaip-demo)
    ws/
      protocol.ts             — ClientMsg / ServerMsg Zod schemas + types
    utils.ts                  — cn() helper (clsx + tailwind-merge)
  public/
    favicon.svg               — EdgePro mark (placeholder droplet for v1)
  tests/
    unit/
      session-reducer.test.ts
      ws-protocol.test.ts
      fsoaip-card.test.tsx
      air-gap-pill.test.tsx
  docs/
    2026-06-06-edgepro-frontend-design.md          — this file
    2026-06-06-edgepro-frontend-implementation-plan.md   — written by writing-plans skill (next)
```

**Notable absences:**
- No `tailwind.config.ts` — Tailwind v4 reads config from CSS via `@theme` (matches rensei's setup).
- No `middleware.ts` — single page, no i18n routing, no auth.
- No `drizzle/` — no DB.
- No `messages/` — no next-intl; JA + EN strings inlined in components.

## Open decisions deferred to runtime

These are intentionally not blockers — the components are built to support both options, and the choice is a prop or runtime flag:

- **Mic capture pattern:** press-and-hold vs click-to-toggle. Default press-and-hold. Prop on `<MicButton>`.
- **Stats strip visibility:** `<StatsStrip metrics={...} />` **renders by default** with W&B-exported fixture (`data/fixtures/wandb-metrics.json`), gated on at least one card being `complete`. Surfaces Track 2's "measurable improvement over base" deliverable directly in the UI rather than only in slides. Pass `metrics={[]}` to hide.
- **Number of model cards rendered:** controlled by the `models` array sent in `ClientMsg.start`. **Default `['base', 'edgepro']`** — base + fine-tuned side-by-side so the improvement is visible the moment the first demo completes. Track 2 compliance baked into the surface, not deferred to the slide deck. To collapse to a single fine-tuned card, remove the `base` entry.
- **F-SOAIP field display order:** `focus → subjective → objective → assessment → intervention → plan` (canonical). Easy to swap if the demo wants a different reveal order.

## Risks

| Risk | Mitigation |
|---|---|
| Two 1.5B models in memory on Strix Halo for the dual-card view may not fit. | Backend can run base + fine-tuned sequentially; frontend is unaffected — `fsoaip_field` events just arrive interleaved over time, not in parallel. |
| Live mic permissions on the AMD demo box may not be pre-granted. | Test on the assigned PC during Day 1 setup window. Build a clear "Click to enable microphone" idle state in `<MicButton>`. |
| JA-aware grapheme splitting on the backend not implemented. | Flag explicitly to backend team (this doc). Worst case: render with `font-feature-settings: "calt"` and tolerate a flash of `�`. |
| Liquid hex `#3FB8E5` is a best-read approximation — `liquid.ai` is JS-rendered and WebFetch couldn't extract the exact brand hex. | Easy to swap if a Liquid brand kit lands — palette is one CSS variable in `globals.css`. Reference: PDF event guide page 1 droplet emoji is standard `💧` (not a custom color). |
| `the F-SOAIP TypeScript contract` may evolve on the F-SOAIP contract branch before merge. | Pin to the commit SHA at copy time. Document the SHA in the copied file header. |
| Rensei `globals.css` uses Tailwind v4 `@theme` block but also has a legacy `tailwind.config.ts` (v3-style with dark tokens) — confusion about which is active. | EdgePro uses ONLY the v4 `@theme` pattern. No `tailwind.config.ts` file. Avoid the ambiguity. |

## References

- Project context: internal Linear ticket (omitted from public copy)
- **Hackathon guide:** Hack the Liquid WAY event guide (Notion, exported as PDF 2026-06-06)
- **F-SOAIP schema source:** `the F-SOAIP TypeScript contract` on `the F-SOAIP contract branch`
- **Design tokens source:** `the design-system Tailwind config` on `the design-language branch`
- **Related branches:**
  - `the landing reference branch` (Rensei landing page reference)
  - `the F-SOAIP contract branch` (F-SOAIP types + Zod contract + JSON schema)
  - `the design-language branch` (Tailwind tokens)
  - `the platform branch` (broader Rensei app reference)
- **Liquid first-party trainer (out of scope, referenced):** `liquid-audio` Python package (`LFM2AudioChatMapper → LFM2DataLoader → train.py`)
- **Base model:** `LiquidAI/LFM2.5-Audio-1.5B-JP` (HuggingFace)
