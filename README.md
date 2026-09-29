# MotionPlan

**Turn animation ideas into production-ready code.**

MotionPlan is an AI-powered animation planner for frontend developers. Describe an interaction in natural language, get a structured animation plan, a live GSAP-driven preview, a visual timeline, and copy-pasteable GSAP / React / Next.js / CSS code — with built-in performance, accessibility, and responsive advisors.

---

## Features

- **AI animation planner.** Natural-language prompt → validated `AnimationPlan`. Anthropic-backed when configured, deterministic keyword fallback otherwise.
- **Live GSAP preview.** Real animations run in the preview panel, with play / pause / replay / reset / 0.5×–2× speed controls, viewport toggle (desktop / tablet / mobile), and `prefers-reduced-motion` support.
- **Interactive timeline.** Click / drag / resize element blocks, adjust delay / duration / stagger inline, zoom, and see a real-time playhead.
- **Deterministic code generator.** 5 targets — plain GSAP, GSAP + ScrollTrigger, React, Next.js, CSS — all pure functions of the plan.
- **Advisors.** Performance, Accessibility, and Responsive advice computed from the plan on every edit — no AI round-trip.
- **Projects.** Local project storage with rename, duplicate, delete, JSON export. Supabase-ready abstraction.
- **10 built-in presets** (Fade Up/Down/Left/Right · Scale In · Text Reveal · Stagger Cards · Parallax · Pin Section · Horizontal Scroll) plus 6 project templates.

## Tech Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS v4**
- **GSAP 3** + **ScrollTrigger**
- **Zod** for runtime validation
- **Lucide React** for icons
- **ESLint 9** flat config · **Prettier**

Zero runtime deps beyond the above. No UI kit, no state library, no bundled highlighter.

## Architecture

```
app/
  page.tsx                       Landing (Navbar, Hero, HowItWorks, Features, Example, Dev, CTA, Footer)
  app/page.tsx                   Projects list
  app/new/page.tsx               Template picker
  app/project/[id]/page.tsx      Persistent workspace
  api/animation/generate/route.ts  POST endpoint — AI plan generation (server-only)
  docs/page.tsx
  layout.tsx                     Root layout · Inter font · dark theme · OG/Twitter metadata
  globals.css                    Design tokens · syntax highlighter styles

components/
  landing/                       Landing sections (Hero, HowItWorks, Features, ExampleAnimation, DevSection, CtaSection, Footer)
  layout/Navbar.tsx              Sticky landing navbar
  ui/                            Lightweight primitives (Button, Input, Select, Tabs, Card, Badge, Panel, Tooltip, Divider, EmptyState)
  projects/                      ProjectsList, TemplatePicker
  workspace/                     ProjectWorkspace, WorkspaceShell, WorkspaceHeader, LeftPanel, CenterPanel, RightPanel
  animation/
    AnimationBuilder.tsx         Prompt / preset / style / trigger / framework form + AI generate
    AnimationPreview.tsx         Live preview shell with controls + viewport
    AnimationControls.tsx        Play/Pause/Replay/Reset + speed + viewport toggle
    AnimationTimeline.tsx        Interactive timeline editor (drag/resize/zoom/playhead)
    AnimationPlan.tsx            Right-panel Plan tab
    CodePanel.tsx                Right-panel Code tab (5 targets, copy + download)
    PerformancePanel.tsx         Performance advisor
    AccessibilityPanel.tsx       Accessibility advisor + reduced-motion CSS snippet
    ResponsivePanel.tsx          Responsive advisor (desktop/tablet/mobile)
    AdvisorShared.tsx            Advisor status header + issue list + rec list
    preview/                     Preview scenes (Hero, Cards, TextReveal, Gallery, Navbar, HorizontalScroll)

lib/
  animation/
    presets.ts                   10 preset factories
    samples.ts                   Hero Cinematic Entrance
    engine.ts                    Legacy stub (kept for backwards compat)
    preview-engine.ts            Real GSAP engine (createPreview + PreviewHandle)
    timeline.ts                  buildTimelineSegments + timelineTotalDuration
    utils.ts                     normalizePlan, validatePlan, toGsapVars, planToGsapCode, cn helpers
    options.ts                   STYLE/TRIGGER/FRAMEWORK dropdown lists, example prompts
    code-generator.ts            Deterministic multi-target code generator
    highlight.ts                 Zero-dep JS + CSS tokenizer
    advisor.ts                   Shared AdvisorStatus / AdvisorIssue / AdvisorResult
    performance.ts               Performance advisor
    accessibility.ts             Accessibility advisor + reducedMotionCss()
    responsive.ts                Responsive advisor (per breakpoint)
  ai/
    provider.ts                  Server-only factory (Anthropic if key, else Mock)
    anthropic-provider.ts        Fetch-based Anthropic Messages API — no SDK dep
    mock-provider.ts             Deterministic keyword-driven fallback
    prompts.ts                   System + user + repair prompt builders
    schema.ts                    Zod schema + safeValidatePlan
    client.ts                    Browser wrapper (generateAnimationPlan) + GenerationError
  projects/
    types.ts                     Project + ProjectSummary
    storage.ts                   ProjectsRepository interface + LocalStorageRepository
    supabase-stub.ts             Placeholder with SQL schema + activation notes
    templates.ts                 6 project templates

types/
  animation.ts                   AnimationPlan + related types (source of truth)
  project.ts                     Project types (legacy)
  ai.ts                          AI request/response + error codes
```

**The `AnimationPlan` is the single source of truth.** Every mutation flows through `normalizePlan → validatePlan → setPlan`. Preview, timeline, code generator, and all three advisors are pure functions of the plan.

## Local Development

Requirements: Node ≥ 20, npm ≥ 10.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Other scripts:

```bash
npm run build       # production build
npm run start       # start built app
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript check
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Var | Where | Purpose | Required? |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | public | Base URL used for OpenGraph metadata | No (defaults to `http://localhost:3000`) |
| `AI_API_KEY` | **server-only** | Anthropic API key. When set, the AI provider switches from Mock to Anthropic. | No |
| `AI_MODEL` | server-only | Override the default `claude-sonnet-4-6` model | No |
| `AI_PROVIDER` | server-only | Set to `mock` to force the mock provider even when `AI_API_KEY` is set | No |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | reserved | Placeholders for future Supabase-backed persistence | No |

**Never** prefix an AI or Supabase key with `NEXT_PUBLIC_` — that publishes it to the browser bundle.

### AI Provider Configuration

- **No key set** → the app runs in Mock mode. The `/api/animation/generate` endpoint returns a deterministic keyword-driven plan (fade / text-reveal / stagger / horizontal / etc.). Great for demos and local dev.
- **`AI_API_KEY` set** → the endpoint calls Anthropic's Messages API with a strict JSON prompt + one repair pass. Default model is `claude-sonnet-4-6`; override with `AI_MODEL`. Uses `cache_control: ephemeral` on the system prompt for cost savings.
- **Force mock** with `AI_PROVIDER=mock` (useful for E2E tests that shouldn't hit the network).

## Deployment (Vercel)

1. Push this repo to GitHub / GitLab / Bitbucket.
2. In Vercel, **Add New → Project** → import the repo.
3. Framework preset auto-detects **Next.js**. Confirm:
   - **Install command:** `npm install`
   - **Build command:** `npm run build`
   - **Output directory:** `.next` (default)
4. Add environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL, e.g. `https://motionplan.vercel.app`
   - `AI_API_KEY` — (optional) your Anthropic API key
   - `AI_MODEL` — (optional) e.g. `claude-sonnet-4-6`
5. Deploy. The `/api/animation/generate` route runs on the **Node.js runtime** (declared explicitly), suitable for the Anthropic fetch call.

No `vercel.json` required — defaults are correct.

## Security Notes

- `lib/ai/provider.ts`, `lib/ai/anthropic-provider.ts`, and `lib/projects/supabase-stub.ts` import `"server-only"`. Bundling them into a client component fails at build time.
- The `/api/animation/generate` route validates its body with Zod, rejects empty prompts with a typed error code, catches provider failures, and returns sanitized user-facing messages (raw errors are logged server-side only).
- The preview panel renders scenes from a fixed set of components — the plan can only choose *which* selectors GSAP animates, never inject markup or scripts.
- No `dangerouslySetInnerHTML` anywhere in the app.

## Future Roadmap

- **Supabase persistence + auth.** Wire the stub with row-level security so projects survive across devices and users.
- **Per-element property editor.** Sliders for x/y/scale/rotation/opacity/ease directly in the workspace.
- **Streaming AI status.** Real token stream in the "Generating…" state.
- **Public preset gallery.** User-shared presets browsable at `/presets`.
- **Figma import.** Convert Figma frames into starting `AnimationPlan`s.
- **Multi-timeline projects.** Multiple named plans per project.

## License

MIT — free to use, modify, and ship.
