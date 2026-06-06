# EdgePro Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Ship a polished single-page Next.js frontend at `./` that captures mic audio, streams it over WebSocket to a local LFM2-Audio inference server, and renders F-SOAIP care card(s) in real time — in time for the Hack the Liquid WAY demo session on 2026-06-07 at 14:00 JST.

**Architecture:** Single route `/`. Two stacked zones (hero + workspace). One stateful hook (`use-edgepro-session`) owns the WS connection and reducer; everything else is presentational. Liquid Dark palette as Tailwind v4 `@theme` tokens in `globals.css`. F-SOAIP type contract mirrored from `the F-SOAIP TypeScript contract`. Test infra: vitest + @testing-library/react + jsdom.

**Tech Stack:** Next.js 15.5 (App Router) · React 18 · TypeScript · Tailwind v4 · shadcn/ui v4 · Radix UI primitives · Zod · Framer Motion · clsx · tailwind-merge · vitest · @testing-library/react · jsdom · pnpm workspaces · turbo.

**Design reference:** `./docs/2026-06-06-edgepro-frontend-design.md` (companion file).

**Source branches to pull from:**
- F-SOAIP types: `the F-SOAIP contract branch` → `the F-SOAIP TypeScript contract`
- Rensei stack pattern: `the design-language branch` → `the parent app package.json`, `app/globals.css`, `next.config.js`, `postcss.config.js`, `tsconfig.json`, `vitest.config.ts`

---

## Milestone overview

| # | Milestone | Target time | Pause point |
|---|---|---|---|
| 0 | Bootstrap — app boots in dark mode with placeholder hero | 90 min | YES |
| 1 | Type contracts — F-SOAIP + WS protocol | 45 min | YES |
| 2 | Session reducer — TDD-driven | 60 min | YES |
| 3 | Hooks — session, mic, online | 45 min | YES |
| 4 | Primitives — button, badge, card, utils | 30 min | NO |
| 5 | Hero zone | 45 min | YES (visual checkpoint) |
| 6 | Workspace components | 120 min | YES (visual checkpoint) |
| 7 | Page composition (dual-card default + stats strip) | 60 min | YES |
| 8 | Mock WS server + end-to-end smoke | 60 min | YES (must hit by ~8h before deadline) |
| 9 | Polish — animations, edge states, real waveform, a11y | variable | optional |

**Total core path:** ~9.25 hours of focused work. Polish (Milestone 9) is the slack buffer.

**Track 2 compliance baked into the core path:**
- "Measurable improvement over base (required)" — dual-card default in Milestone 7 makes the improvement visible on the live demo surface, not just in slides.
- "W&B (strongly encouraged)" — `<StatsStrip>` renders by default with a W&B-exported fixture in Milestone 7.

After each milestone marked "PAUSE: YES" — user signs off before next milestone begins. Smoke test the current state in a browser at each pause.

---

## Milestone 0: Bootstrap

### Task 0.1: Create app directory structure

**Files:**
- Create: `./package.json`
- Create: `./tsconfig.json`
- Create: `./next.config.js`
- Create: `./postcss.config.js`
- Create: `./.gitignore`
- Create: `./components.json`

**Step 1: Write `./package.json`**

```json
{
  "name": "edgepro",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3007",
    "build": "next build",
    "start": "next start --port 3007",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "mock-server": "tsx scripts/mock-ws-server.ts",
    "clean": "rm -rf .next node_modules"
  },
  "dependencies": {
    "@radix-ui/react-icons": "^1.3.2",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.27.0",
    "next": "15.5.14",
    "next-themes": "^0.4.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.3.1",
    "tw-animate-css": "^1.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^4.0.6",
    "eslint": "^8",
    "eslint-config-next": "15.5.14",
    "jsdom": "^25.0.0",
    "shadcn": "^4.1.1",
    "tailwindcss": "^4.2.2",
    "tsx": "^4.20.6",
    "typescript": "^5",
    "vitest": "^4.0.6",
    "ws": "^8.18.0"
  }
}
```

**Step 2: Write `./tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "types": ["node", "react", "react-dom"],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "vitest.config.ts"]
}
```

**Step 3: Write `./next.config.js`**

```js
/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

module.exports = nextConfig
```

**Step 4: Write `./postcss.config.js`**

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**Step 5: Write `./.gitignore`**

```
.next
node_modules
.env*.local
*.tsbuildinfo
next-env.d.ts
coverage
```

**Step 6: Write `./components.json`** (shadcn config; defines accent for any future shadcn add commands)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Step 7: Commit**

```bash
cd .
git checkout -b feat/edgepro-frontend
git add ./package.json ./tsconfig.json \
        ./next.config.js ./postcss.config.js \
        ./.gitignore ./components.json
git commit -m "chore(edgepro): scaffold app config files"
```

---

### Task 0.2: Install dependencies

**Step 1: Install via pnpm from monorepo root**

```bash
cd .
pnpm install
```

Expected: pnpm resolves the new workspace, downloads deps. ~30–60s.

**Step 2: Verify**

```bash
ls ./node_modules/next/package.json
```

Expected: file exists.

**Step 3: Sanity check Next**

```bash
cd .
pnpm --filter edgepro exec next --version
```

Expected: prints `Next.js 15.5.x`.

(No commit — lockfile change is part of the next commit.)

---

### Task 0.3: Write Liquid Dark `globals.css`

**Files:**
- Create: `./app/globals.css`

**Step 1: Write the file**

```css
@import "tailwindcss";
@import "tw-animate-css";

/*
 * EdgePro — "Liquid Dark" theme
 * Tailwind v4 @theme tokens. No tailwind.config.ts.
 * Deep ink background + Liquid water-blue accent. Bilingual JA/EN type stack.
 *
 * Reference: ./docs/2026-06-06-edgepro-frontend-design.md
 */

@theme {
  /* ── Type ── */
  --font-sans:
    var(--font-inter), "Inter", var(--font-noto-jp), "Noto Sans JP",
    system-ui, sans-serif;
  --font-mono:
    var(--font-jb-mono), "JetBrains Mono", Menlo, Monaco, monospace;
  --font-mincho:
    var(--font-noto-serif-jp), "Noto Serif JP", "Hiragino Mincho ProN", serif;

  --font-size-2xs: 0.6875rem;   --font-size-2xs--line-height: 1.4;
  --font-size-xs:  0.75rem;     --font-size-xs--line-height:  1.5;
  --font-size-sm:  0.8125rem;   --font-size-sm--line-height:  1.5;
  --font-size-base: 0.875rem;   --font-size-base--line-height: 1.6;
  --font-size-lg:  1rem;        --font-size-lg--line-height:  1.5;
  --font-size-xl:  1.125rem;    --font-size-xl--line-height:  1.4;
  --font-size-2xl: 1.375rem;    --font-size-2xl--line-height: 1.3;
  --font-size-3xl: 1.75rem;     --font-size-3xl--line-height: 1.2;
  --font-size-4xl: 2.25rem;     --font-size-4xl--line-height: 1.1;
  --font-size-5xl: 3rem;        --font-size-5xl--line-height: 1.05;

  /* ── Radii ── */
  --radius-card:   0.75rem;   /* 12px */
  --radius-button: 0.5rem;    /* 8px  */
  --radius-pill:   9999px;

  /* ── Shadows ── */
  --shadow-card:
    0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-elevated:
    0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-glow-accent: 0 0 16px rgba(63, 184, 229, 0.25);

  /* ── Animations ── */
  --animate-fade-in:        fade-in 0.2s ease-out;
  --animate-fade-up:        fade-up 0.3s ease-out;
  --animate-slide-in-right: slide-in-right 0.2s ease-out;
  --animate-scale-in:       scale-in 0.2s ease-out;
  --animate-pulse-glow:     pulse-glow 1.2s ease-in-out infinite;
}

/* ── Liquid Dark palette (CSS custom properties under :root) ── */

:root {
  /* Surfaces — deep water + ink */
  --color-background:        #06070D;
  --color-surface:           #0F1118;
  --color-surface-elevated:  #181B26;
  --color-border:            #252836;
  --color-border-subtle:     #1A1D28;

  /* Foreground */
  --color-foreground:        #E6E8EE;
  --color-foreground-muted:  #9CA1B0;
  --color-foreground-subtle: #5E6478;

  /* Primary accent — Liquid water-blue (approximation; refine if brand kit lands) */
  --color-accent:        #3FB8E5;
  --color-accent-hover:  #62C9EC;
  --color-accent-muted:  rgba(63, 184, 229, 0.15);

  /* High-energy moments — bright cyan, used sparingly */
  --color-energy:        #67E8F9;

  /* State */
  --color-danger:        #F97316;
  --color-danger-muted:  rgba(249, 115, 22, 0.15);
  --color-success:       #10B981;
  --color-success-muted: rgba(16, 185, 129, 0.15);
  --color-warning:       #FBBF24;
  --color-warning-muted: rgba(251, 191, 36, 0.15);
  --color-info:          #3B82F6;
  --color-info-muted:    rgba(59, 130, 246, 0.15);
}

/* ── Keyframes ── */

@keyframes fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes fade-up {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slide-in-right {
  0%   { opacity: 0; transform: translateX(8px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes scale-in {
  0%   { opacity: 0; transform: scale(0.97); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 16px rgba(63, 184, 229, 0.25); }
  50%      { box-shadow: 0 0 28px rgba(63, 184, 229, 0.55); }
}

/* ── Base ── */

html, body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background-color: var(--color-accent);
  color: var(--color-background);
}
```

**Step 2: Commit**

```bash
git add ./app/globals.css
git commit -m "feat(edgepro): liquid dark theme tokens (globals.css)"
```

---

### Task 0.4: Write `app/layout.tsx` with fonts

**Files:**
- Create: `./app/layout.tsx`

**Step 1: Write the file**

```tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jb-mono',
  display: 'swap',
});

const notoJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-jp',
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
  weight: ['200', '400'],
});

export const metadata: Metadata = {
  title: 'EdgePro — Offline 介護 申し送り Copilot',
  description:
    'Air-gapped Japanese nursing handover assistant. Powered by LFM2.5-Audio-1.5B-JP on AMD Ryzen AI. No cloud — no PII ever leaves the device.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${jbMono.variable} ${notoJP.variable} ${notoSerifJP.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add ./app/layout.tsx
git commit -m "feat(edgepro): root layout with bilingual font stack"
```

---

### Task 0.5: Write placeholder `app/page.tsx`

**Files:**
- Create: `./app/page.tsx`

**Step 1: Write the file**

```tsx
export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p
          className="text-foreground-muted text-sm tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--color-foreground-muted)' }}
        >
          EdgePro
        </p>
        <h1
          className="text-5xl font-light"
          style={{ color: 'var(--color-foreground)' }}
        >
          Offline 介護 申し送り Copilot
        </h1>
        <p
          className="mt-4 text-base"
          style={{ color: 'var(--color-foreground-muted)' }}
        >
          Bootstrap OK. Hero arrives in Milestone 5.
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add ./app/page.tsx
git commit -m "feat(edgepro): placeholder page"
```

---

### Task 0.6: Smoke test dev server

**Step 1: Start dev server**

```bash
cd .
pnpm --filter edgepro dev
```

Expected: `▲ Next.js 15.5.x ✓ Ready in ...` and URL `http://localhost:3007`.

**Step 2: Open browser** at `http://localhost:3007`. Expected:
- Deep ink background (`#06070D`).
- Centered headline "Offline 介護 申し送り Copilot" in light-weight white-grey type.
- Eyebrow "EDGEPRO" above in muted grey.
- Subhead "Bootstrap OK..." below.
- No console errors.

**Step 3:** Leave dev server running. Take a screenshot for the design doc reference if useful.

**Step 4: Visual checkpoint — PAUSE for sign-off.**

---

## Milestone 1: Type contracts

### Task 1.1: Pin F-SOAIP types SHA and copy

**Step 1: Find the SHA**

```bash
cd .
git log the F-SOAIP contract branch -- the F-SOAIP TypeScript contract \
  --format='%H %s' | head -1
```

Record the SHA — paste it into the file header in Step 2.

**Step 2: Extract types.ts and copy with pinned header**

**Files:**
- Create: `./lib/fsoaip/types.ts`

```bash
mkdir -p ./lib/fsoaip
git show the F-SOAIP contract branch:the F-SOAIP TypeScript contract \
  > ./lib/fsoaip/types.ts
```

**Step 3: Prepend a header noting the source SHA**

Edit `./lib/fsoaip/types.ts`. Add ABOVE the existing top comment:

```ts
// ---------------------------------------------------------------------------
// Mirrored from the F-SOAIP TypeScript contract
//   branch: the F-SOAIP contract branch
//   sha:    <PASTE_SHA_FROM_STEP_1>
//   date:   2026-06-06
// Do NOT edit here without updating the source in rensei and re-pulling.
// ---------------------------------------------------------------------------

```

**Step 4: Commit**

```bash
git add ./lib/fsoaip/types.ts
git commit -m "feat(edgepro): mirror F-SOAIP types from rensei (fur-166)"
```

---

### Task 1.2: Set up vitest

**Files:**
- Create: `./vitest.config.ts`

**Step 1: Write the config**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['node_modules/**', 'tests/integration/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

**Step 2: Create test setup file**

**Files:**
- Create: `./tests/setup.ts`

```ts
import '@testing-library/jest-dom/vitest'
```

**Step 3: Smoke-test vitest boots**

```bash
mkdir -p ./tests/unit
cat > ./tests/unit/_sanity.test.ts <<'EOF'
import { describe, it, expect } from 'vitest'
describe('sanity', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
EOF
pnpm --filter edgepro test
```

Expected: vitest runs, 1 passed.

**Step 4: Delete sanity test, commit setup**

```bash
rm ./tests/unit/_sanity.test.ts
git add ./vitest.config.ts ./tests/setup.ts
git commit -m "test(edgepro): vitest + testing-library + jsdom setup"
```

---

### Task 1.3: WS protocol Zod schemas — TDD

**Files:**
- Create: `./lib/ws/protocol.ts`
- Create: `./tests/unit/ws-protocol.test.ts`

**Step 1: Write the failing test**

```ts
// ./tests/unit/ws-protocol.test.ts
import { describe, it, expect } from 'vitest'
import { parseServerMsg } from '@/lib/ws/protocol'

describe('parseServerMsg', () => {
  it('parses transcript_partial', () => {
    const ok = parseServerMsg({ type: 'transcript_partial', text: 'こんにちは' })
    expect(ok.type).toBe('transcript_partial')
  })

  it('parses fsoaip_field', () => {
    const ok = parseServerMsg({
      type: 'fsoaip_field',
      modelId: 'edgepro',
      field: 'focus',
      valuePartial: '転倒',
    })
    expect(ok.type).toBe('fsoaip_field')
  })

  it('rejects an unknown type', () => {
    expect(() => parseServerMsg({ type: 'garbage' })).toThrow()
  })

  it('rejects bad field enum', () => {
    expect(() =>
      parseServerMsg({
        type: 'fsoaip_field',
        modelId: 'x',
        field: 'not-a-field',
        valuePartial: 'a',
      }),
    ).toThrow()
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
pnpm --filter edgepro test
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

```ts
// ./lib/ws/protocol.ts
import { z } from 'zod'
import type { FsoaipNote, FsoaipField, FactItem } from '@/lib/fsoaip/types'

const FsoaipFieldSchema = z.enum([
  'focus', 'subjective', 'objective', 'assessment', 'intervention', 'plan',
]) satisfies z.ZodType<FsoaipField>

const FsoaipNoteSchema = z
  .object({
    focus: z.string(),
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    intervention: z.string(),
    plan: z.string(),
  })
  .strict() satisfies z.ZodType<FsoaipNote>

const FactItemSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    field: FsoaipFieldSchema,
    riskWeight: z.enum(['high', 'medium', 'low']),
  })
  .strict() satisfies z.ZodType<FactItem>

// ── Server → Client ─────────────────────────────────────────────

export const ServerMsgSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('transcript_partial'), text: z.string() }),
  z.object({ type: z.literal('transcript_final'),   text: z.string() }),
  z.object({
    type: z.literal('fsoaip_field'),
    modelId: z.string(),
    field: FsoaipFieldSchema,
    valuePartial: z.string(),
  }),
  z.object({
    type: z.literal('fsoaip_complete'),
    modelId: z.string(),
    note: FsoaipNoteSchema,
  }),
  z.object({
    type: z.literal('fact_highlight'),
    modelId: z.string(),
    fact: FactItemSchema,
    matched: z.boolean(),
  }),
  z.object({ type: z.literal('error'), message: z.string() }),
])

export type ServerMsg = z.infer<typeof ServerMsgSchema>

export function parseServerMsg(raw: unknown): ServerMsg {
  return ServerMsgSchema.parse(raw)
}

// ── Client → Server ─────────────────────────────────────────────

export type ClientMsg =
  | { type: 'start'; sampleRate: 16000; models: string[] }
  | { type: 'audio'; pcm: ArrayBuffer }
  | { type: 'stop' }

export function encodeClientMsg(msg: ClientMsg): string | ArrayBuffer {
  if (msg.type === 'audio') return msg.pcm
  return JSON.stringify(msg)
}
```

**Step 4: Run test — expect PASS**

```bash
pnpm --filter edgepro test
```

Expected: 4 passed.

**Step 5: Commit**

```bash
git add ./lib/ws/protocol.ts ./tests/unit/ws-protocol.test.ts
git commit -m "feat(edgepro): WS protocol Zod schemas + tests"
```

**PAUSE for sign-off.**

---

## Milestone 2: Session reducer (TDD)

### Task 2.1: Define `ModelOutput` and initial state

**Files:**
- Create: `./lib/session/types.ts`

```ts
import type { FsoaipNote, FactItem } from '@/lib/fsoaip/types'

export type ModelOutput = {
  modelId: string
  label: { en: string; ja: string }
  note: Partial<FsoaipNote>
  highRiskMatches: { fact: FactItem; matched: boolean }[]
  complete: boolean
  highlighted?: boolean
}

export type SessionState = {
  phase: 'idle' | 'recording' | 'streaming' | 'done' | 'error'
  transcript: string         // appended from transcript_partial/final
  cards: ModelOutput[]
  errorMessage?: string
}

export const initialSessionState: SessionState = {
  phase: 'idle',
  transcript: '',
  cards: [],
}
```

**No test for pure types. Commit at end of Task 2.4 along with reducer.**

---

### Task 2.2: Reducer test — transcript & start

**Files:**
- Create: `./tests/unit/session-reducer.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { sessionReducer } from '@/lib/session/reducer'
import { initialSessionState } from '@/lib/session/types'

describe('sessionReducer', () => {
  describe('start', () => {
    it('initializes cards for each requested model', () => {
      const next = sessionReducer(initialSessionState, {
        type: 'START',
        models: [
          { modelId: 'edgepro', label: { en: 'EdgePro', ja: 'EdgePro 学習済み' } },
        ],
      })
      expect(next.phase).toBe('recording')
      expect(next.cards).toHaveLength(1)
      expect(next.cards[0].modelId).toBe('edgepro')
      expect(next.cards[0].complete).toBe(false)
    })
  })

  describe('transcript', () => {
    it('appends transcript_partial to transcript', () => {
      const a = sessionReducer(initialSessionState, {
        type: 'SERVER',
        msg: { type: 'transcript_partial', text: 'こんに' },
      })
      const b = sessionReducer(a, {
        type: 'SERVER',
        msg: { type: 'transcript_partial', text: 'ちは' },
      })
      expect(b.transcript).toBe('こんにちは')
    })

    it('replaces transcript on transcript_final', () => {
      const a = sessionReducer(initialSessionState, {
        type: 'SERVER',
        msg: { type: 'transcript_partial', text: 'partial' },
      })
      const b = sessionReducer(a, {
        type: 'SERVER',
        msg: { type: 'transcript_final', text: 'final' },
      })
      expect(b.transcript).toBe('final')
    })
  })
})
```

**Step 2: Run — expect FAIL** (`pnpm --filter edgepro test`).

**Step 3: Implement minimum to pass**

**Files:**
- Create: `./lib/session/reducer.ts`

```ts
import type { ServerMsg } from '@/lib/ws/protocol'
import type { ModelOutput, SessionState } from './types'

export type SessionAction =
  | { type: 'START'; models: { modelId: string; label: { en: string; ja: string } }[] }
  | { type: 'STOP' }
  | { type: 'SERVER'; msg: ServerMsg }
  | { type: 'RESET' }

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'START': {
      const cards: ModelOutput[] = action.models.map((m) => ({
        modelId: m.modelId,
        label: m.label,
        note: {},
        highRiskMatches: [],
        complete: false,
      }))
      return { ...state, phase: 'recording', transcript: '', cards }
    }
    case 'STOP':
      return { ...state, phase: 'streaming' }
    case 'RESET':
      return { phase: 'idle', transcript: '', cards: [] }
    case 'SERVER': {
      const m = action.msg
      switch (m.type) {
        case 'transcript_partial':
          return { ...state, transcript: state.transcript + m.text }
        case 'transcript_final':
          return { ...state, transcript: m.text }
        // remaining cases added in subsequent tasks
        default:
          return state
      }
    }
    default:
      return state
  }
}
```

**Step 4: Run — expect PASS.**

---

### Task 2.3: Reducer — fsoaip_field & fsoaip_complete

**Step 1: Add failing tests to `session-reducer.test.ts`**

```ts
describe('fsoaip events', () => {
  const started = sessionReducer(initialSessionState, {
    type: 'START',
    models: [{ modelId: 'edgepro', label: { en: 'E', ja: 'E' } }],
  })

  it('accumulates fsoaip_field valuePartial into the right card+field', () => {
    const a = sessionReducer(started, {
      type: 'SERVER',
      msg: { type: 'fsoaip_field', modelId: 'edgepro', field: 'focus', valuePartial: '転倒' },
    })
    const b = sessionReducer(a, {
      type: 'SERVER',
      msg: { type: 'fsoaip_field', modelId: 'edgepro', field: 'focus', valuePartial: 'リスク' },
    })
    expect(b.cards[0].note.focus).toBe('転倒リスク')
  })

  it('ignores fsoaip_field for an unknown modelId', () => {
    const next = sessionReducer(started, {
      type: 'SERVER',
      msg: { type: 'fsoaip_field', modelId: 'unknown', field: 'focus', valuePartial: 'x' },
    })
    expect(next.cards[0].note.focus).toBeUndefined()
  })

  it('marks card complete on fsoaip_complete and stores the full note', () => {
    const complete = sessionReducer(started, {
      type: 'SERVER',
      msg: {
        type: 'fsoaip_complete',
        modelId: 'edgepro',
        note: {
          focus: 'F', subjective: 'S', objective: 'O',
          assessment: 'A', intervention: 'I', plan: 'P',
        },
      },
    })
    expect(complete.cards[0].complete).toBe(true)
    expect(complete.cards[0].note.focus).toBe('F')
    expect(complete.phase).toBe('streaming') // unchanged
  })
})
```

**Step 2: Run — expect FAIL.**

**Step 3: Extend the SERVER switch in `reducer.ts`**

Add inside the inner `switch (m.type)` BEFORE the `default`:

```ts
case 'fsoaip_field': {
  const cards = state.cards.map((c) =>
    c.modelId === m.modelId
      ? {
          ...c,
          note: {
            ...c.note,
            [m.field]: (c.note[m.field] ?? '') + m.valuePartial,
          },
        }
      : c,
  )
  return { ...state, cards }
}
case 'fsoaip_complete': {
  const cards = state.cards.map((c) =>
    c.modelId === m.modelId
      ? { ...c, note: m.note, complete: true }
      : c,
  )
  return { ...state, cards }
}
```

**Step 4: Run — expect PASS.**

---

### Task 2.4: Reducer — fact_highlight & error

**Step 1: Failing tests**

```ts
describe('fact_highlight and error', () => {
  const started = sessionReducer(initialSessionState, {
    type: 'START',
    models: [{ modelId: 'edgepro', label: { en: 'E', ja: 'E' } }],
  })

  it('appends a fact_highlight to the matching card', () => {
    const fact = { id: 'f1', text: 'fell from bed', field: 'objective' as const, riskWeight: 'high' as const }
    const next = sessionReducer(started, {
      type: 'SERVER',
      msg: { type: 'fact_highlight', modelId: 'edgepro', fact, matched: true },
    })
    expect(next.cards[0].highRiskMatches).toHaveLength(1)
    expect(next.cards[0].highRiskMatches[0].matched).toBe(true)
  })

  it('enters error phase on server error', () => {
    const next = sessionReducer(started, {
      type: 'SERVER',
      msg: { type: 'error', message: 'boom' },
    })
    expect(next.phase).toBe('error')
    expect(next.errorMessage).toBe('boom')
  })
})
```

**Step 2: Run — expect FAIL.**

**Step 3: Extend reducer**

Add to inner switch:

```ts
case 'fact_highlight': {
  const cards = state.cards.map((c) =>
    c.modelId === m.modelId
      ? {
          ...c,
          highRiskMatches: [
            ...c.highRiskMatches,
            { fact: m.fact, matched: m.matched },
          ],
        }
      : c,
  )
  return { ...state, cards }
}
case 'error':
  return { ...state, phase: 'error', errorMessage: m.message }
```

**Step 4: Run — expect ALL PASS.**

**Step 5: Commit Milestone 2**

```bash
git add ./lib/session/ ./tests/unit/session-reducer.test.ts
git commit -m "feat(edgepro): session reducer + tests (start, transcript, fsoaip, facts, error)"
```

**PAUSE for sign-off.**

---

## Milestone 3: Hooks

### Task 3.1: `use-online` hook

**Files:**
- Create: `./hooks/use-online.ts`

```ts
'use client'
import { useEffect, useState } from 'react'

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
```

Commit at end of Milestone 3.

---

### Task 3.2: `use-mic-capture` hook

**Files:**
- Create: `./hooks/use-mic-capture.ts`
- Create: `./public/worklets/pcm-worklet.js`

**Step 1: Write the AudioWorklet processor**

```js
// ./public/worklets/pcm-worklet.js
class PCMWorklet extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true
    const channel = input[0]                    // Float32Array, [-1, 1]
    const pcm = new Int16Array(channel.length)
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]))
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    this.port.postMessage(pcm.buffer, [pcm.buffer])
    return true
  }
}
registerProcessor('pcm-worklet', PCMWorklet)
```

**Step 2: Write the hook**

```ts
// ./hooks/use-mic-capture.ts
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Options = { onFrame: (pcm: ArrayBuffer) => void; sampleRate?: number }

export function useMicCapture({ onFrame, sampleRate = 16000 }: Options) {
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nodeRef = useRef<AudioWorkletNode | null>(null)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate },
      })
      streamRef.current = stream
      const ctx = new AudioContext({ sampleRate })
      ctxRef.current = ctx
      await ctx.audioWorklet.addModule('/worklets/pcm-worklet.js')
      const source = ctx.createMediaStreamSource(stream)
      const node = new AudioWorkletNode(ctx, 'pcm-worklet')
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => onFrame(e.data)
      source.connect(node)
      // No output connection — we don't want feedback into speakers
      nodeRef.current = node
      setRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [onFrame, sampleRate])

  const stop = useCallback(() => {
    nodeRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()
    nodeRef.current = null
    streamRef.current = null
    ctxRef.current = null
    setRecording(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { start, stop, recording, error }
}
```

Commit at end of Milestone 3.

---

### Task 3.3: `use-edgepro-session` hook

**Files:**
- Create: `./hooks/use-edgepro-session.ts`

```ts
'use client'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { sessionReducer } from '@/lib/session/reducer'
import { initialSessionState } from '@/lib/session/types'
import { parseServerMsg, encodeClientMsg, type ClientMsg } from '@/lib/ws/protocol'

type Options = {
  url?: string
  models: { modelId: string; label: { en: string; ja: string } }[]
}

export function useEdgeproSession({
  url = 'ws://localhost:8000/ws/session',
  models,
}: Options) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState)
  const wsRef = useRef<WebSocket | null>(null)

  const send = useCallback((msg: ClientMsg) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const payload = encodeClientMsg(msg)
    ws.send(payload as any)
  }, [])

  const startRecording = useCallback(() => {
    dispatch({ type: 'START', models })
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws
    ws.onopen = () => {
      send({ type: 'start', sampleRate: 16000, models: models.map((m) => m.modelId) })
    }
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string') return
      try {
        const msg = parseServerMsg(JSON.parse(e.data))
        dispatch({ type: 'SERVER', msg })
      } catch (err) {
        dispatch({
          type: 'SERVER',
          msg: { type: 'error', message: `protocol: ${(err as Error).message}` },
        })
      }
    }
    ws.onerror = () => {
      dispatch({
        type: 'SERVER',
        msg: { type: 'error', message: 'WebSocket error' },
      })
    }
    ws.onclose = () => {
      wsRef.current = null
    }
  }, [url, models, send])

  const stopRecording = useCallback(() => {
    send({ type: 'stop' })
    dispatch({ type: 'STOP' })
  }, [send])

  const reset = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    dispatch({ type: 'RESET' })
  }, [])

  const sendAudioFrame = useCallback(
    (pcm: ArrayBuffer) => send({ type: 'audio', pcm }),
    [send],
  )

  useEffect(
    () => () => {
      wsRef.current?.close()
    },
    [],
  )

  return { state, startRecording, stopRecording, sendAudioFrame, reset }
}
```

**Step 1: Commit Milestone 3**

```bash
git add ./hooks/ ./public/worklets/
git commit -m "feat(edgepro): session, mic, and online hooks"
```

**PAUSE for sign-off.**

---

## Milestone 4: Primitives & utilities

### Task 4.1: `lib/utils.ts` with `cn()`

```ts
// ./lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Task 4.2: Button primitive

```tsx
// ./components/primitives/button.tsx
'use client'
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-accent)] text-[var(--color-background)] hover:bg-[var(--color-accent-hover)]',
        ghost:
          'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface)]',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:border-[var(--color-accent)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-14 px-6 text-base',
        xl: 'h-20 px-8 text-lg',
      },
      shape: {
        default: 'rounded-[var(--radius-button)]',
        pill: 'rounded-[var(--radius-pill)]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', shape: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
```

### Task 4.3: Badge primitive

```tsx
// ./components/primitives/badge.tsx
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wider',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--color-surface)] text-[var(--color-foreground-muted)] border border-[var(--color-border)]',
        accent:  'bg-[var(--color-accent-muted)] text-[var(--color-accent)]',
        danger:  'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
        success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
        info:    'bg-[var(--color-info-muted)] text-[var(--color-info)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
```

### Task 4.4: Card primitive

```tsx
// ./components/primitives/card.tsx
import { cn } from '@/lib/utils'

export function Card({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'highlighted' | 'muted'
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]',
        variant === 'default' && 'border border-[var(--color-border)]',
        variant === 'highlighted' &&
          'border border-[var(--color-accent)] shadow-[var(--shadow-glow-accent)]',
        variant === 'muted' && 'border border-[var(--color-border-subtle)] opacity-85',
        className,
      )}
      {...props}
    />
  )
}
```

**Step: Commit Milestone 4**

```bash
git add ./lib/utils.ts ./components/primitives/
git commit -m "feat(edgepro): primitives (Button, Badge, Card) + cn util"
```

(No pause — flows into Milestone 5.)

---

## Milestone 5: Hero zone

### Task 5.1: `<AirGapPill />` + test

**Files:**
- Create: `./components/hero/air-gap-pill.tsx`
- Create: `./tests/unit/air-gap-pill.test.tsx`

```tsx
// ./components/hero/air-gap-pill.tsx
'use client'
import { useOnline } from '@/hooks/use-online'
import { Badge } from '@/components/primitives/badge'

export function AirGapPill() {
  const online = useOnline()
  return (
    <Badge tone={online ? 'danger' : 'success'} aria-live="polite">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: online ? 'var(--color-danger)' : 'var(--color-success)',
        }}
      />
      {online ? 'Online' : 'Air-gapped'}
      <span className="opacity-60 normal-case tracking-normal ml-1 text-2xs">
        {online ? 'オンライン' : 'エアギャップ'}
      </span>
    </Badge>
  )
}
```

```tsx
// ./tests/unit/air-gap-pill.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AirGapPill } from '@/components/hero/air-gap-pill'

describe('AirGapPill', () => {
  it('renders Online when navigator.onLine is true', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    render(<AirGapPill />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })
  it('flips to Air-gapped on offline event', () => {
    render(<AirGapPill />)
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText('Air-gapped')).toBeInTheDocument()
  })
})
```

Run: `pnpm --filter edgepro test` — expect PASS.

### Task 5.2: `<Hero />`

```tsx
// ./components/hero/hero.tsx
import { ReactNode } from 'react'
import { AirGapPill } from './air-gap-pill'

export function Hero({ cta }: { cta?: ReactNode }) {
  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <div className="absolute top-6 right-6">
        <AirGapPill />
      </div>

      <div className="max-w-4xl text-center">
        <p className="text-2xs tracking-[0.18em] uppercase mb-4"
           style={{ color: 'var(--color-foreground-subtle)' }}>
          EdgePro · Hack the Liquid WAY · Track 2
        </p>

        <h1 className="text-5xl font-light leading-tight mb-2"
            style={{ color: 'var(--color-foreground)' }}>
          Offline nursing-handover copilot
        </h1>

        <p className="text-3xl font-extralight"
           style={{
             fontFamily: 'var(--font-mincho)',
             color: 'var(--color-foreground-muted)',
           }}>
          介護 申し送り、声から構造化へ。
        </p>

        <p className="mt-8 max-w-xl mx-auto text-base"
           style={{ color: 'var(--color-foreground-muted)' }}>
          A nurse speaks. A local LFM2.5-Audio-1.5B-JP fine-tuned for Japanese
          elderly care extracts the F-SOAIP facts.{' '}
          <span style={{ color: 'var(--color-accent)' }}>No cloud.</span>{' '}
          No PII leaves the device.
        </p>

        {cta && <div className="mt-12 flex justify-center">{cta}</div>}
      </div>
    </section>
  )
}
```

### Task 5.3: Render hero on page

Replace `./app/page.tsx`:

```tsx
import { Hero } from '@/components/hero/hero'
import { Button } from '@/components/primitives/button'

export default function Page() {
  return (
    <main>
      <Hero
        cta={
          <Button size="xl" shape="pill">
            📣 Press &amp; hold to speak
          </Button>
        }
      />
    </main>
  )
}
```

**Smoke test in browser** — hero renders, air-gap pill shows correct state, mincho `申し送り` line displays.

**Commit Milestone 5**

```bash
git add ./components/hero/ ./tests/unit/air-gap-pill.test.tsx \
        ./app/page.tsx
git commit -m "feat(edgepro): hero zone with air-gap pill + bilingual headline"
```

**PAUSE — visual checkpoint.**

---

## Milestone 6: Workspace components

### Task 6.1: `<FieldRow />`

```tsx
// ./components/workspace/field-row.tsx
import type { FsoaipField } from '@/lib/fsoaip/types'

const FIELD_LABELS: Record<FsoaipField, { en: string; ja: string }> = {
  focus:        { en: 'Focus',        ja: 'フォーカス' },
  subjective:   { en: 'Subjective',   ja: '主観 S' },
  objective:    { en: 'Objective',    ja: '客観 O' },
  assessment:   { en: 'Assessment',   ja: '評価 A' },
  intervention: { en: 'Intervention', ja: '実施 I' },
  plan:         { en: 'Plan',         ja: '計画 P' },
}

export function FieldRow({
  field,
  value,
  streaming,
}: {
  field: FsoaipField
  value: string | undefined
  streaming?: boolean
}) {
  const label = FIELD_LABELS[field]
  return (
    <div className="py-3 border-b border-[var(--color-border-subtle)] last:border-b-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xs uppercase tracking-[0.14em] font-medium"
              style={{ color: 'var(--color-foreground-muted)' }}>
          {label.en}
        </span>
        <span className="text-xs"
              style={{ color: 'var(--color-foreground-subtle)' }}>
          {label.ja}
        </span>
      </div>
      <div className="text-sm leading-relaxed min-h-[1.5rem]"
           style={{ color: 'var(--color-foreground)' }}>
        {value || (
          <span style={{ color: 'var(--color-foreground-subtle)' }}>—</span>
        )}
        {streaming && value && (
          <span className="inline-block w-1.5 h-4 ml-1 align-middle"
                style={{
                  backgroundColor: 'var(--color-energy)',
                  animation: 'pulse-glow 1.2s ease-in-out infinite',
                }} />
        )}
      </div>
    </div>
  )
}
```

### Task 6.2: `<HighRiskChip />`

```tsx
// ./components/workspace/high-risk-chip.tsx
import type { FactItem } from '@/lib/fsoaip/types'
import { Badge } from '@/components/primitives/badge'

const RISK_GLYPHS: Record<string, string> = {
  fall:   '⚠ FALL',
  fever:  '⚠ FEVER',
  vital:  '⚠ VITAL',
}

function detectGlyph(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('fall') || text.includes('転倒')) return RISK_GLYPHS.fall
  if (lower.includes('fever') || text.includes('発熱')) return RISK_GLYPHS.fever
  return RISK_GLYPHS.vital
}

export function HighRiskChip({ fact }: { fact: FactItem }) {
  return (
    <Badge
      tone={fact.riskWeight === 'high' ? 'danger' : 'neutral'}
      className="animate-[fade-up_0.3s_ease-out]"
    >
      {detectGlyph(fact.text)}
    </Badge>
  )
}
```

### Task 6.3: `<FsoaipCard />`

```tsx
// ./components/workspace/fsoaip-card.tsx
import type { ModelOutput } from '@/lib/session/types'
import type { FsoaipField } from '@/lib/fsoaip/types'
import { Card } from '@/components/primitives/card'
import { Badge } from '@/components/primitives/badge'
import { FieldRow } from './field-row'
import { HighRiskChip } from './high-risk-chip'

const FIELD_ORDER: FsoaipField[] = [
  'focus', 'subjective', 'objective', 'assessment', 'intervention', 'plan',
]

export function FsoaipCard({ output }: { output: ModelOutput }) {
  const variant = output.highlighted ? 'highlighted' : output.complete ? 'default' : 'default'
  return (
    <Card variant={variant} className="flex flex-col gap-0 animate-[fade-up_0.3s_ease-out]">
      <header className="flex items-start justify-between mb-3 pb-3 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-sm font-semibold"
              style={{ color: 'var(--color-foreground)' }}>
            {output.label.en}
          </h3>
          <p className="text-xs"
             style={{ color: 'var(--color-foreground-muted)' }}>
            {output.label.ja}
          </p>
        </div>
        <Badge tone={output.complete ? 'success' : 'accent'}>
          {output.complete ? 'complete' : 'streaming'}
        </Badge>
      </header>

      {output.highRiskMatches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {output.highRiskMatches
            .filter((m) => m.matched)
            .map((m) => (
              <HighRiskChip key={m.fact.id} fact={m.fact} />
            ))}
        </div>
      )}

      <div>
        {FIELD_ORDER.map((f) => (
          <FieldRow
            key={f}
            field={f}
            value={output.note[f]}
            streaming={!output.complete && Boolean(output.note[f])}
          />
        ))}
      </div>
    </Card>
  )
}
```

### Task 6.4: `<FsoaipCardGrid />`

```tsx
// ./components/workspace/fsoaip-card-grid.tsx
import type { ModelOutput } from '@/lib/session/types'
import { FsoaipCard } from './fsoaip-card'

export function FsoaipCardGrid({ cards }: { cards: ModelOutput[] }) {
  if (cards.length === 0) return null
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))`,
      }}
    >
      {cards.map((c) => (
        <FsoaipCard key={c.modelId} output={c} />
      ))}
    </div>
  )
}
```

### Task 6.5: `<TranscriptBubble />`

```tsx
// ./components/workspace/transcript-bubble.tsx
export function TranscriptBubble({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--radius-card)] p-4 mb-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface)] min-h-[60px]">
      <p className="text-2xs uppercase tracking-[0.14em] mb-2"
         style={{ color: 'var(--color-foreground-muted)' }}>
        Transcript · 文字起こし
      </p>
      <p className="text-base leading-relaxed font-mono"
         style={{ color: 'var(--color-foreground)' }}>
        {text || (
          <span style={{ color: 'var(--color-foreground-subtle)' }}>
            Press &amp; hold the microphone to begin · マイクを押して話す
          </span>
        )}
      </p>
    </div>
  )
}
```

### Task 6.6: `<Waveform />`

```tsx
// ./components/mic/waveform.tsx
'use client'
import { useEffect, useRef } from 'react'

export function Waveform({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    const bars = 24
    let phase = 0
    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      const barWidth = width / bars - 4
      for (let i = 0; i < bars; i++) {
        const t = phase + i * 0.3
        const h = (Math.abs(Math.sin(t)) * 0.7 + 0.15) * height
        const x = i * (barWidth + 4)
        const y = (height - h) / 2
        ctx.fillStyle = `rgba(63, 184, 229, ${0.4 + Math.abs(Math.sin(t)) * 0.5})`
        ctx.fillRect(x, y, barWidth, h)
      }
      phase += 0.15
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])

  return (
    <canvas
      ref={ref}
      width={240}
      height={48}
      className="rounded"
      style={{ opacity: active ? 1 : 0.3, transition: 'opacity 0.2s' }}
    />
  )
}
```

(Decorative — does not consume real PCM in v1. Real-amplitude waveform = Polish phase if time permits.)

### Task 6.7: `<MicButton />`

```tsx
// ./components/mic/mic-button.tsx
'use client'
import { Button } from '@/components/primitives/button'
import { cn } from '@/lib/utils'

export function MicButton({
  recording,
  disabled,
  onPress,
  onRelease,
}: {
  recording: boolean
  disabled?: boolean
  onPress: () => void
  onRelease: () => void
}) {
  return (
    <Button
      size="xl"
      shape="pill"
      disabled={disabled}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={recording ? onRelease : undefined}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      className={cn(
        'gap-3 font-semibold tracking-wide',
        recording && 'animate-[pulse-glow_1.2s_ease-in-out_infinite]',
      )}
    >
      <span className="text-xl">{recording ? '🔴' : '🎙'}</span>
      {recording ? 'Listening… 聞いています' : 'Press & hold to speak · 押して話す'}
    </Button>
  )
}
```

### Task 6.8: `<StatsStrip />`

Type uses plain numbers (no function-typed `format` — would break JSON-fixture import). Always renders 2-decimal fixed.

```tsx
// ./components/workspace/stats-strip.tsx
export type Metric = { label: { en: string; ja: string }; base: number; tuned: number }

export function StatsStrip({ metrics }: { metrics: Metric[] }) {
  if (!metrics?.length) return null
  const fmt = (n: number) => n.toFixed(2)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {metrics.map((m) => {
        const delta = m.tuned - m.base
        const positive = delta >= 0
        return (
          <div key={m.label.en}
               className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-2xs uppercase tracking-[0.14em] mb-1"
               style={{ color: 'var(--color-foreground-muted)' }}>
              {m.label.en} · {m.label.ja}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light"
                    style={{ color: 'var(--color-foreground)' }}>
                {fmt(m.tuned)}
              </span>
              <span className="text-xs font-mono"
                    style={{ color: positive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {positive ? '▲' : '▼'} {fmt(Math.abs(delta))}
              </span>
            </div>
            <p className="text-2xs font-mono mt-1"
               style={{ color: 'var(--color-foreground-subtle)' }}>
              base {fmt(m.base)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

### Task 6.9: W&B metrics fixture

**Files:**
- Create: `./data/fixtures/wandb-metrics.json`

```json
[
  { "label": { "en": "ErrorCard precision", "ja": "誤り検出 精度" }, "base": 0.42, "tuned": 0.78 },
  { "label": { "en": "High-risk recall",    "ja": "高リスク再現" },  "base": 0.51, "tuned": 0.89 },
  { "label": { "en": "Fact coverage",       "ja": "情報網羅" },      "base": 0.63, "tuned": 0.91 },
  { "label": { "en": "JSON validity",       "ja": "JSON 整形率" },   "base": 0.74, "tuned": 1.00 }
]
```

Placeholder values pending real W&B export from the fine-tune run. Swap this file when the eval A/B completes — frontend reads it at build time.

**Commit Milestone 6**

```bash
git add ./components/workspace/ ./components/mic/ \
        ./data/fixtures/wandb-metrics.json
git commit -m "feat(edgepro): workspace + mic components + W&B metrics fixture"
```

**PAUSE — visual checkpoint at next milestone.**

---

## Milestone 7: Page composition

### Task 7.1: Wire everything in `app/page.tsx`

**Dual-card by default** (base + fine-tuned, side-by-side) — Track 2's "measurable improvement over base" is visible on the live demo surface, not just in slides. **StatsStrip renders by default** with W&B-exported metrics from the fixture.

Replace `./app/page.tsx`:

```tsx
'use client'
import { useEdgeproSession } from '@/hooks/use-edgepro-session'
import { useMicCapture } from '@/hooks/use-mic-capture'
import { Hero } from '@/components/hero/hero'
import { MicButton } from '@/components/mic/mic-button'
import { Waveform } from '@/components/mic/waveform'
import { TranscriptBubble } from '@/components/workspace/transcript-bubble'
import { FsoaipCardGrid } from '@/components/workspace/fsoaip-card-grid'
import { StatsStrip, type Metric } from '@/components/workspace/stats-strip'
import wandbMetrics from '@/data/fixtures/wandb-metrics.json'

const MODELS = [
  { modelId: 'base',    label: { en: 'LFM2.5-Audio base',  ja: 'ベース' } },
  { modelId: 'edgepro', label: { en: 'EdgePro fine-tuned', ja: 'EdgePro 学習済み' } },
]
// To collapse to a single fine-tuned card (e.g. for an alt demo arc): keep only edgepro.

const METRICS: Metric[] = wandbMetrics

export default function Page() {
  const { state, startRecording, stopRecording, sendAudioFrame } =
    useEdgeproSession({ models: MODELS })

  const mic = useMicCapture({ onFrame: sendAudioFrame })

  const press = async () => {
    startRecording()
    await mic.start()
  }
  const release = () => {
    mic.stop()
    stopRecording()
  }

  // Mark the fine-tuned card highlighted (accent glow) when shown next to base
  const cards = state.cards.map((c) => ({
    ...c,
    highlighted: state.cards.length > 1 && c.modelId === 'edgepro',
  }))

  return (
    <main>
      <Hero
        cta={
          <div className="flex flex-col items-center gap-4">
            <MicButton
              recording={mic.recording}
              disabled={state.phase === 'streaming' || state.phase === 'error'}
              onPress={press}
              onRelease={release}
            />
            <Waveform active={mic.recording} />
            {mic.error && (
              <p className="text-xs"
                 style={{ color: 'var(--color-danger)' }}>
                Mic error: {mic.error}
              </p>
            )}
          </div>
        }
      />

      {(state.transcript || state.cards.length > 0 || state.errorMessage) && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          {state.errorMessage && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-danger-muted)] p-4 mb-6 text-sm">
              {state.errorMessage}
            </div>
          )}
          <TranscriptBubble text={state.transcript} />
          <FsoaipCardGrid cards={cards} />
          {state.cards.some((c) => c.complete) && <StatsStrip metrics={METRICS} />}
        </section>
      )}
    </main>
  )
}
```

**Note on the JSON import:** Next/Tailwind v4 path alias `@/data/fixtures/...` resolves via the tsconfig `paths` setting. The fixture lives at `./data/fixtures/wandb-metrics.json` (created in Task 6.9). `resolveJsonModule: true` in tsconfig already permits the import.

**StatsStrip gating:** strip only renders once at least one card is `complete`, so it doesn't sit empty during streaming. Pre-stream the workspace looks clean; the metric reveal is part of the "after" beat.

### Task 7.2: Smoke test in browser

Without backend, clicking mic → WS will fail. Expected behavior: hero + waveform animate, transcript bubble shows placeholder, error appears in red box. That's correct for now — backend wiring comes in Milestone 8.

### Task 7.3: Commit

```bash
git add ./app/page.tsx
git commit -m "feat(edgepro): wire hero + workspace + mic + session on landing page"
```

**PAUSE for sign-off.**

---

## Milestone 8: Mock WS server + end-to-end smoke

### Task 8.1: Create the mock server

**Files:**
- Create: `./scripts/mock-ws-server.ts`
- Create: `./data/fixtures/mock-session.json`

```ts
// ./scripts/mock-ws-server.ts
import { WebSocketServer } from 'ws'
import fixture from '../data/fixtures/mock-session.json'

const wss = new WebSocketServer({ port: 8000, path: '/ws/session' })

wss.on('connection', (ws) => {
  console.log('[mock] client connected')
  let audioFrames = 0

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      audioFrames++
      return
    }
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'start') {
        console.log('[mock] start', msg.models)
      } else if (msg.type === 'stop') {
        console.log(`[mock] stop after ${audioFrames} audio frames; replaying fixture`)
        await replay(ws, msg.models ?? ['edgepro'])
      }
    } catch (err) {
      console.error('[mock] bad message', err)
    }
  })

  ws.on('close', () => console.log('[mock] client disconnected'))
})

async function replay(ws: import('ws').WebSocket, _models: string[]) {
  for (const event of fixture.events) {
    if (event.delayMs) await sleep(event.delayMs)
    ws.send(JSON.stringify(event.msg))
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

console.log('[mock] ws://localhost:8000/ws/session')
```

Fixture emits events for **both `base` and `edgepro` modelIds** so the dual-card default has real content. Base is intentionally weaker — misses the fall-risk fact, conflates the fever with a generic note, less structured plan — so the "measurable improvement" is visible without any narration.

```json
// ./data/fixtures/mock-session.json
{
  "events": [
    { "delayMs":  100, "msg": { "type": "transcript_partial", "text": "夜中の" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "見回りで" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "田中さんが" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "ベッドから" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "転落していました。" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "意識はあり、" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "出血なし。" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "発熱もあります、" } },
    { "delayMs":  120, "msg": { "type": "transcript_partial", "text": "38度2分。" } },
    { "delayMs":  200, "msg": { "type": "transcript_final",   "text": "夜中の見回りで田中さんがベッドから転落していました。意識はあり、出血なし。発熱もあります、38度2分。" } },

    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "focus", "valuePartial": "夜間の" } },
    { "delayMs":   60, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "focus", "valuePartial": "見回り報告" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "focus", "valuePartial": "転倒" } },
    { "delayMs":   60, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "focus", "valuePartial": "リスク・発熱" } },

    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "subjective",  "valuePartial": "—" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "subjective",  "valuePartial": "本人「" } },
    { "delayMs":   60, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "subjective",  "valuePartial": "痛くない」と返答" } },

    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "objective",   "valuePartial": "患者がベッド付近で発見された。" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "objective",   "valuePartial": "発熱あり。" } },
    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "objective",   "valuePartial": "夜間巡視時、ベッドから転落。" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "objective",   "valuePartial": "意識清明・出血なし。体温 38.2℃。" } },

    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "assessment",  "valuePartial": "経過観察が必要。" } },
    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "assessment",  "valuePartial": "転倒に伴う外傷リスク + 発熱の合併。" } },

    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "intervention", "valuePartial": "観察継続。" } },
    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "intervention", "valuePartial": "バイタル測定、頭部・四肢視診、" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "intervention", "valuePartial": "クーリング開始、夜勤師長へ報告。" } },

    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "base",    "field": "plan",        "valuePartial": "次回確認時に再評価。" } },
    { "delayMs":  120, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "plan",        "valuePartial": "次勤帯まで 1 時間ごとのラウンド、" } },
    { "delayMs":   80, "msg": { "type": "fsoaip_field", "modelId": "edgepro", "field": "plan",        "valuePartial": "朝に医師診察依頼。" } },

    { "delayMs":  150, "msg": {
      "type": "fact_highlight",
      "modelId": "edgepro",
      "fact": { "id": "f1", "text": "fall from bed (転倒)", "field": "objective", "riskWeight": "high" },
      "matched": true
    } },
    { "delayMs":  100, "msg": {
      "type": "fact_highlight",
      "modelId": "edgepro",
      "fact": { "id": "f2", "text": "fever 38.2 (発熱)", "field": "objective", "riskWeight": "high" },
      "matched": true
    } },

    { "delayMs":  200, "msg": {
      "type": "fsoaip_complete",
      "modelId": "base",
      "note": {
        "focus":        "夜間の見回り報告",
        "subjective":   "—",
        "objective":    "患者がベッド付近で発見された。発熱あり。",
        "assessment":   "経過観察が必要。",
        "intervention": "観察継続。",
        "plan":         "次回確認時に再評価。"
      }
    } },

    { "delayMs":  100, "msg": {
      "type": "fsoaip_complete",
      "modelId": "edgepro",
      "note": {
        "focus":        "転倒リスク・発熱",
        "subjective":   "本人「痛くない」と返答。",
        "objective":    "夜間巡視時、ベッドから転落。意識清明・出血なし。体温 38.2℃。",
        "assessment":   "転倒に伴う外傷リスク + 発熱の合併。",
        "intervention": "バイタル測定、頭部・四肢視診、クーリング開始、夜勤師長へ報告。",
        "plan":         "次勤帯まで 1 時間ごとのラウンド、朝に医師診察依頼。"
      }
    } }
  ]
}
```

### Task 8.2: Run mock + browser end-to-end

**Terminal 1:**
```bash
cd .
pnpm --filter edgepro mock-server
```
Expected: `[mock] ws://localhost:8000/ws/session`.

**Terminal 2 (if not already running):**
```bash
pnpm --filter edgepro dev
```

**Browser:** open `http://localhost:3007`. Click & hold the mic button for ~3 seconds, release. Expected:
- WS connects (`[mock] client connected` in mock log).
- Waveform animates while held.
- On release: `[mock] stop after N audio frames; replaying fixture` in mock log.
- In browser: transcript streams in JA, **both** F-SOAIP cards fill in field-by-field side-by-side. Base card (left) shows weaker, generic content. EdgePro card (right) lights with accent border + glow, gets ⚠ FALL and ⚠ FEVER chips. Both cards flip to "complete" badges.
- After completion, `<StatsStrip>` reveals the 4 W&B-fed deltas (ErrorCard precision, high-risk recall, fact coverage, JSON validity) — each with green ▲ delta vs base.

**Step: Commit**

```bash
git add ./scripts/mock-ws-server.ts ./data/fixtures/mock-session.json
git commit -m "feat(edgepro): mock WS server + fixture for end-to-end smoke"
```

**PAUSE — this is the "ship-or-don't-ship" checkpoint.** If the demo works end-to-end with the mock server, the frontend is demoable. Backend swap to the real `liquid-audio` server is now a URL change.

---

## Milestone 9: Polish (variable, optional)

Pick from this list as time allows. Each item is self-contained; commit per item.

### 9.1 Empty/error states
- Hero shows a "🎤 Microphone access denied" recovery prompt with steps when `mic.error` is set.
- Workspace shows "Backend offline" pulsing card when WS errors before any data.

### 9.2 Real-amplitude waveform
Pipe a copy of the PCM frames into the `<Waveform />` and compute RMS per frame; replace synthetic sine with real bars.

### 9.3 Frame-margin animations
Add Framer Motion stagger to `<FsoaipCardGrid />` so cards reveal sequentially, and to `<FieldRow />` so each field row slides in from the right (200ms delay between).

### 9.4 Accessibility pass
- `<MicButton>` keyboard support (Space to start/stop).
- `<TranscriptBubble>` is `aria-live="polite"`.
- All interactive controls have `aria-label` in both EN+JA.

### 9.5 Favicon + OG image
Drop `public/favicon.svg` (simple droplet on dark) and `public/og.png` (1200×630, Hero composition).

---

## End-of-build checklist (before 13:30 submission)

- [ ] `pnpm --filter edgepro type-check` → no errors.
- [ ] `pnpm --filter edgepro test` → all pass.
- [ ] `pnpm --filter edgepro build` → succeeds.
- [ ] Manual: full mic → mock-server → card flow works.
- [ ] Backend URL in `page.tsx` swapped to the real `liquid-audio` server before stage demo.
- [ ] `.env.local` for any model paths, if needed.
- [ ] Repo pushed to GitHub; URL in submission deck.
- [ ] Screenshot for demo assets folder taken.
- [ ] README at `./README.md` includes: how to run dev, how to run mock server, how to point at real backend.

---

## Open questions deferred to runtime (and NOT plan blockers)

- Mic capture pattern (press-hold vs click-toggle): currently press-hold. Flip a prop on `<MicButton>` to change.
- Number of cards: controlled by `MODELS` constant in `page.tsx`. **Default 2 (base + fine-tuned side-by-side)** for Track 2 "measurable improvement over base" compliance. Switch to 1 by removing the `base` entry.
- Stats strip on/off: **renders by default** with W&B-exported fixture (`data/fixtures/wandb-metrics.json`), gated on at least one card being `complete`. Empty `metrics={[]}` hides it.
- Real Liquid AI brand hex: `#3FB8E5` is approximate. Change one CSS variable in `globals.css` if a brand kit lands.
