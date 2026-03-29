# Tasks: Migrate Front-End into Next.js + Supabase Monorepo

**PRD:** `tasks/prd-frontend-nextjs-integration.md`
**Working Branch:** `feature/design-integration` (all work happens here)
**Merge Target:** `BE-FE-Integration` (Next.js 15 + Supabase monorepo in `frontend/` + `backend/`)
**Strategy:** Restructure code on `feature/design-integration` so that `frontend/` matches the Next.js structure expected by `BE-FE-Integration`. Remove `Thecouncilv1/`. On merge, our `frontend/` extends their boilerplate and their `backend/` comes in without conflicts.

## Relevant Files

### Config & Setup (new — created to match BE-FE-Integration structure)

- `frontend/package.json` — Next.js 15 dependencies + our additions (lucide-react, clsx, tailwind-merge, etc.)
- `frontend/next.config.ts` — Next.js configuration (empty config, matches BE branch)
- `frontend/tsconfig.json` — TypeScript config with `@/`* path alias pointing to `./`
- `frontend/postcss.config.mjs` — PostCSS with `@tailwindcss/postcss` plugin
- `frontend/eslint.config.mjs` — ESLint flat config with next/core-web-vitals
- `frontend/next-env.d.ts` — Next.js TypeScript declarations
- `frontend/middleware.ts` — Supabase session refresh middleware (copied from BE branch)
- `frontend/.env.local` — Supabase credentials + `NEXT_PUBLIC_USE_MOCK_RELAY` toggle (gitignored, created manually)

### Supabase Helpers (new — replicated from BE-FE-Integration)

- `frontend/utils/supabase/client.ts` — Browser Supabase client factory
- `frontend/utils/supabase/server.ts` — Server-side Supabase client factory (cookies-based)
- `frontend/utils/supabase/middleware.ts` — Session update logic for Next.js middleware

### Foundation Layer (new)

- `frontend/lib/types.ts` — TypeScript interfaces aligned with Prisma schema (Council, CouncilAgent, CouncilRound, DebateMessage, Profile)
- `frontend/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge) and brand color constants
- `frontend/lib/models.ts` — `AVAILABLE_MODELS` constant with OpenRouter model keys and `/images/` paths
- `frontend/app/globals.css` — Tailwind v4 import + tw-animate-css + theme.css tokens + keyframe animations (fadeIn, popIn)

### Supabase API Layer (new)

- `frontend/lib/api.ts` — Supabase-direct CRUD functions + orchestration call placeholder

### Shared Components (new — ported from Thecouncilv1)

- `frontend/components/Button.tsx` — Ported from `Thecouncilv1/src/app/components/Button.tsx`, import path updated
- `frontend/components/Input.tsx` — Ported from `Thecouncilv1/src/app/components/Input.tsx` (includes Textarea), import path updated
- `frontend/components/Sidebar.tsx` — Ported from `Thecouncilv1/src/app/components/Layout.tsx` (Sidebar only), React Router → Next.js, logout → Supabase

### Pages & Layouts (new — ported from Thecouncilv1)

- `frontend/app/layout.tsx` — Root layout (html, body, globals.css, metadata)
- `frontend/app/login/page.tsx` — Ported from `Thecouncilv1/src/app/pages/Login.tsx`, username→email, mock auth→Supabase
- `frontend/app/(authenticated)/layout.tsx` — Server Component auth guard + Sidebar + `{children}`
- `frontend/app/(authenticated)/page.tsx` — Ported from `Thecouncilv1/src/app/pages/Dashboard.tsx`
- `frontend/app/(authenticated)/new/page.tsx` — Ported from `Thecouncilv1/src/app/pages/Setup.tsx`
- `frontend/app/(authenticated)/council/[id]/page.tsx` — Ported from `Thecouncilv1/src/app/pages/CouncilRun.tsx`

### Assets (copied from Thecouncilv1)

- `frontend/public/images/Chatgpt.png` — GPT model logo
- `frontend/public/images/Claude.png` — Claude model logo
- `frontend/public/images/Gemini.png` — Gemini model logo
- `frontend/public/images/OLlama.png` — Llama model logo
- `frontend/public/images/profile.png` — Default user avatar

### Root Files (new/modified)

- `package.json` — Root workspace scripts (`dev`, `build`, `db:migrate`, etc.) matching BE branch
- `.gitignore` — Updated to cover frontend/, backend/, node_modules, .env files, .next/
- `README.md` — Project overview matching BE branch

### Source Files (read — not modified, used as reference for porting)

- `Thecouncilv1/src/app/pages/Login.tsx` — Source for Login page port
- `Thecouncilv1/src/app/pages/Dashboard.tsx` — Source for Dashboard page port
- `Thecouncilv1/src/app/pages/Setup.tsx` — Source for Setup page port
- `Thecouncilv1/src/app/pages/CouncilRun.tsx` — Source for CouncilRun page port
- `Thecouncilv1/src/app/components/Layout.tsx` — Source for Sidebar component port
- `Thecouncilv1/src/app/components/Button.tsx` — Source for Button component port
- `Thecouncilv1/src/app/components/Input.tsx` — Source for Input/Textarea component port
- `Thecouncilv1/src/app/utils/styles.ts` — Source for cn() and brand colors
- `Thecouncilv1/src/app/utils/models.ts` — Source for AVAILABLE_MODELS constant
- `Thecouncilv1/src/styles/theme.css` — Source for CSS custom properties (182 lines)
- `Thecouncilv1/src/app/styles.css` — Source for keyframe animations (fadeIn, popIn)
- `Thecouncilv1/src/styles/tailwind.css` — Source for Tailwind config + tw-animate-css import

### Files to Delete (end of migration)

- `Thecouncilv1/` — Entire old Vite project directory (removed after all porting is verified)

### Notes

- This project does not use Jest or a test runner — no unit test files are listed. Testing is manual (verify routes, auth flow, visual parity).
- We are creating `frontend/` from scratch on this branch, replicating the config/structure from `BE-FE-Integration` (fetched via `git show origin/BE-FE-Integration:path`). On merge, our richer `frontend/` will supersede their boilerplate.
- Supabase table/column names use `snake_case`; TypeScript interfaces use `camelCase`. The `api.ts` helpers handle mapping.
- No `ui/` shadcn components are imported by any of the 4 pages — the entire `ui/` directory is skipped.
- The `fonts.css` file in the original project is empty — it can be omitted.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- 1.0 Project Setup & Scaffolding
  - 1.1 Create the `frontend/` directory and all required subdirectories: `frontend/app/`, `frontend/app/login/`, `frontend/app/(authenticated)/`, `frontend/app/(authenticated)/new/`, `frontend/app/(authenticated)/council/[id]/`, `frontend/components/`, `frontend/lib/`, `frontend/utils/supabase/`, `frontend/public/images/`.
  - 1.2 Create `frontend/package.json` — base it on the BE branch version (name: `the-council-frontend`, Next.js 15, React 19, `@supabase/ssr`, `@supabase/supabase-js`, Tailwind v4) and add: `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`. Include scripts: `dev` (next dev --turbopack), `build`, `start`, `lint`.
  - 1.3 Create `frontend/next.config.ts` — empty Next.js config matching BE branch (`const nextConfig: NextConfig = {}; export default nextConfig;`).
  - 1.4 Create `frontend/tsconfig.json` — matching BE branch (target ES2017, `@/`* → `./*` path alias, Next.js plugin, bundler moduleResolution).
  - 1.5 Create `frontend/postcss.config.mjs` — with `@tailwindcss/postcss` plugin (matching BE branch).
  - 1.6 Create `frontend/eslint.config.mjs` — flat config extending `next/core-web-vitals` and `next/typescript` (matching BE branch).
  - 1.7 Create `frontend/next-env.d.ts` — standard Next.js TypeScript reference declarations.
  - 1.8 Create `frontend/utils/supabase/client.ts` — replicate exactly from BE branch (`createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).
  - 1.9 Create `frontend/utils/supabase/server.ts` — replicate exactly from BE branch (server client with cookie getAll/setAll using `cookies()` from `next/headers`).
  - 1.10 Create `frontend/utils/supabase/middleware.ts` — replicate exactly from BE branch (`updateSession` function for session refresh).
  - 1.11 Create `frontend/middleware.ts` — replicate exactly from BE branch (calls `updateSession`, exports `config.matcher` to skip static assets).
  - 1.12 Copy image assets: `Thecouncilv1/src/assets/Chatgpt.png`, `Claude.png`, `Gemini.png`, `OLlama.png`, `profile.png` → `frontend/public/images/`.
  - 1.13 Create root `package.json` — matching BE branch structure with `postinstall` (installs both `backend` and `frontend`), and shortcut scripts: `dev`, `build`, `start`, `lint` (prefix frontend), `db:ping`, `db:migrate`, `db:studio`, `db:generate` (prefix backend).
  - 1.14 Update `.gitignore` — expand to cover: `frontend/node_modules`, `frontend/.next/`, `frontend/out/`, `frontend/.env.local`, `frontend/.env*.local`, `backend/node_modules`, `backend/.env`, `backend/.env.local`, `/node_modules`, `/.next/`, `/out/`, `.env`, `.env.local`, `/generated/prisma`, `.DS_Store`.
  - 1.15 Run `npm install` inside `frontend/` to generate `package-lock.json` and install all dependencies.
  - 1.16 Verify the bare Next.js app starts: run `npm run dev` from `frontend/`, confirm it loads at `localhost:3000` without errors, then stop the server.
- 2.0 Foundation Layer (Types, Utilities, CSS)
  - 2.1 Create `frontend/lib/types.ts` — define all TypeScript types aligned with the Prisma schema: `CouncilStatus` (union: DRAFT | ACTIVE | COMPLETED | ARCHIVED), `AgentSlot` (CROWN | AGENT_B | AGENT_C | AGENT_D), `DebateMessageAuthor` (USER | AGENT), and interfaces `Profile`, `Council`, `CouncilAgent`, `CouncilRound`, `DebateMessage`. Use exact field names from PRD Section 7.1.
  - 2.2 Create `frontend/lib/utils.ts` — export `cn()` function (import `clsx` and `twMerge` from `tailwind-merge`). Export `BrandColors` object with `blue: "#002D72"`, `green: "#007749"`, `amber: "#F59E0B"`.
  - 2.3 Create `frontend/lib/models.ts` — export `AVAILABLE_MODELS` array with 4 entries. Each entry: `{ id, name, role, img, modelKey }`. Image paths use `/images/Chatgpt.png` format (Next.js public folder). Add `modelKey` field for OpenRouter identifiers (e.g., `"openai/gpt-5"`, `"anthropic/claude-3.5-sonnet"`, `"meta-llama/llama-3"`, `"google/gemini-pro"`).
  - 2.4 Create `frontend/app/globals.css` — combine into a single file: (a) Tailwind v4 import (`@import "tailwindcss";`), (b) `tw-animate-css` import (`@import "tw-animate-css";`), (c) full contents of `Thecouncilv1/src/styles/theme.css` (`:root` CSS variables, `.dark` overrides, `@theme inline` block, `@layer base` typography), (d) keyframe animations from `Thecouncilv1/src/app/styles.css` (`fadeIn`, `popIn`).
- 3.0 Shared Components
  - 3.1 Create `frontend/components/Button.tsx` — copy from `Thecouncilv1/src/app/components/Button.tsx`. Change import: `import { cn } from "../utils/styles"` → `import { cn } from "@/lib/utils"`. Add `"use client";` directive at top. No other changes needed.
  - 3.2 Create `frontend/components/Input.tsx` — copy from `Thecouncilv1/src/app/components/Input.tsx` (includes both `Input` and `Textarea` exports). Change import: `import { cn } from "../utils/styles"` → `import { cn } from "@/lib/utils"`. Add `"use client";` directive at top.
  - 3.3 Create `frontend/components/Sidebar.tsx` — port the `Sidebar` component from `Thecouncilv1/src/app/components/Layout.tsx` (lines 16–91, the `Sidebar` function only — NOT the `Layout` function). Apply these changes:
    - 3.3.1 Add `"use client";` directive at top.
    - 3.3.2 Replace `import { Link, ... } from "react-router"` with `import Link from "next/link"` and `import { usePathname, useRouter } from "next/navigation"`.
    - 3.3.3 Replace all `<Link to="...">` with `<Link href="...">`.
    - 3.3.4 Replace `useLocation()` → `usePathname()`. Update usage: `location.pathname` → just the pathname variable directly.
    - 3.3.5 Replace `useNavigate()` → `useRouter()`. Update `navigate("/login")` → `router.push("/login")`.
    - 3.3.6 Wire logout to Supabase: import `createClient` from `@/utils/supabase/client`, and in `handleLogout`, call `const supabase = createClient(); await supabase.auth.signOut();` before `router.push("/login")`.
    - 3.3.7 Replace `import imgShape from "@/assets/profile.png"` → `const imgShape = "/images/profile.png"` (static path from public folder).
    - 3.3.8 Replace `import { cn } from "../utils/styles"` → `import { cn } from "@/lib/utils"`.
    - 3.3.9 Replace the hardcoded `previousChats` array with a `councils` prop: `{ councils: { id: string; title: string }[] }`. The parent layout will pass this data. Keep the fallback hardcoded list as default prop value for now.
- 4.0 Supabase API Layer
  - 4.1 Create `frontend/lib/api.ts` — add file header with `import { createClient } from "@/utils/supabase/client"` and import types from `@/lib/types`.
  - 4.2 Implement `listCouncils()` — query `supabase.from("councils").select("id, title, status, created_at").order("created_at", { ascending: false })`. Map `snake_case` result to `camelCase` return type. Returns `Pick<Council, "id" | "title" | "status" | "createdAt">[]`.
  - 4.3 Implement `getCouncil(id: string)` — query `supabase.from("councils").select("*, council_agents(*), council_rounds(*, debate_messages(*))").eq("id", id).single()`. Map nested `snake_case` result to `camelCase` types. Returns `Council` with nested `agents`, `rounds`, and `messages`.
  - 4.4 Implement `createCouncil(data)` — accepts `{ title, primaryPrompt, agents: [...], cycleCount }`. Steps: (1) get current user via `supabase.auth.getUser()`, (2) insert into `councils` table with `owner_id`, `title`, `primary_prompt`, `status: "DRAFT"`, (3) insert into `council_agents` for each agent, (4) insert `cycleCount` rows into `council_rounds`. Returns `{ id: string }`.
  - 4.5 Implement `saveDebateMessage(data)` — insert into `debate_messages` table. Map `camelCase` input to `snake_case` columns. Returns `{ id: string }`.
  - 4.6 Implement `startCouncilRound(councilId, roundNumber)` — update the matching `council_rounds` row's `started_at` to `new Date().toISOString()`. Also update `councils.status` to `"ACTIVE"` if it's currently `"DRAFT"`. Returns `{ roundId: string }`.
  - 4.7 Implement `completeCouncil(councilId, finalSummary)` — update `councils` row: set `status` to `"COMPLETED"` and `final_summary` to the given string.
  - 4.8 Add `triggerCouncilRun(councilId: string)` placeholder — a `fetch("/api/council/${councilId}/run", { method: "POST" })` call. Add a `// TODO: Backend team implements this endpoint (OpenRouter orchestration)` comment. This is the interface the backend team will build.
  - 4.9 Add `pollCouncilMessages(councilId: string, afterSequence: number)` placeholder — a `fetch` call to `GET /api/council/${councilId}/messages?after=${afterSequence}`. Add `// TODO: Backend team implements this endpoint` comment.
- 5.0 Pages & Layouts
  - 5.1 Update `frontend/app/layout.tsx` — create the root layout as a Server Component. Import `./globals.css`. Set `metadata` (title: "The Council", description: "EagleHacks 2026"). Render `<html lang="en"><body className="antialiased">{children}</body></html>`.
  - 5.2 Create `frontend/app/login/page.tsx` — port from `Thecouncilv1/src/app/pages/Login.tsx`. Apply these changes:
    - 5.2.1 Add `"use client";` directive.
    - 5.2.2 Replace `import { useNavigate } from "react-router"` → `import { useRouter } from "next/navigation"`. Replace `navigate("/")` → `router.push("/")`.
    - 5.2.3 Replace `import { Button } from "../components/Button"` → `import { Button } from "@/components/Button"`. Same pattern for `Input`.
    - 5.2.4 Change the "Username" field to "Email": update label text, input `type="email"`, placeholder to `"name@example.com"`, state variable `username` → `email`, and the `setUsername` → `setEmail` handler.
    - 5.2.5 Replace mock auth logic: import `createClient` from `@/utils/supabase/client`. In `handleSubmit` for login: `const { error } = await supabase.auth.signInWithPassword({ email, password })`. On error, set `errorState("incorrect")`. On success, `router.push("/")`.
    - 5.2.6 For sign-up: `const { error } = await supabase.auth.signUp({ email, password })`. On error, show error modal. On success, `router.push("/")`. (Profile row is created automatically by DB trigger.)
    - 5.2.7 Remove the "Prototype hint: Use admin / admin" section.
    - 5.2.8 Update error messages: "Incorrect credentials" for login failures, "Sign up failed" with `error.message` from Supabase for sign-up failures.
    - 5.2.9 Make `handleSubmit` an `async` function (needed for `await` on Supabase calls).
  - 5.3 Create `frontend/app/(authenticated)/layout.tsx` — Server Component auth guard:
    - 5.3.1 Import `createClient` from `@/utils/supabase/server` and `cookies` from `next/headers` and `redirect` from `next/navigation`.
    - 5.3.2 In the async layout function: `const cookieStore = await cookies(); const supabase = createClient(cookieStore); const { data: { user } } = await supabase.auth.getUser();`. If `!user`, call `redirect("/login")`.
    - 5.3.3 Optionally fetch the user's council list here: `const { data: councils } = await supabase.from("councils").select("id, title, status, created_at").eq("owner_id", user.id).order("created_at", { ascending: false });`.
    - 5.3.4 Render the layout: `<div className="flex w-full h-screen ..."><Sidebar councils={councils ?? []} /><div className="flex-1 ...">{children}</div></div>`. Match the flex structure from the original `Layout` component in `Thecouncilv1/src/app/components/Layout.tsx` (lines 93–104).
  - 5.4 Create `frontend/app/(authenticated)/page.tsx` — port from `Thecouncilv1/src/app/pages/Dashboard.tsx`:
    - 5.4.1 Add `import Link from "next/link"`. Remove `import { Link } from "react-router"`.
    - 5.4.2 Replace `<Link to="/new">` → `<Link href="/new">`.
    - 5.4.3 Update `Button` and icon imports to use `@/components/Button` and `lucide-react`.
    - 5.4.4 This can be a Server Component (no hooks, no state) — do NOT add `"use client"`.
  - 5.5 Create `frontend/app/(authenticated)/new/page.tsx` — port from `Thecouncilv1/src/app/pages/Setup.tsx`:
    - 5.5.1 Add `"use client";` directive (uses useState, event handlers).
    - 5.5.2 Replace `import { useNavigate } from "react-router"` → `import { useRouter } from "next/navigation"`. Replace `navigate(...)` → `router.push(...)`.
    - 5.5.3 Update all component imports: `Button` → `@/components/Button`, `Input`/`Textarea` → `@/components/Input`, `cn` → `@/lib/utils`, `AVAILABLE_MODELS` → `@/lib/models`.
    - 5.5.4 Replace the `handleStart` function: instead of `navigate("/council/new-run", { state: { ... } })`, call `createCouncil()` from `@/lib/api` with the form data. Map `selectedModels` array to `agents` array with `slot` assignment: first selected = `"CROWN"` (if crowned), others = `"AGENT_B"`, `"AGENT_C"`, `"AGENT_D"` in order. On success, `router.push(`/council/${result.id}`)`.
    - 5.5.5 Make `handleStart` async. Add loading state (`const [isSubmitting, setIsSubmitting] = useState(false)`) and disable the button while submitting.
  - 5.6 Create `frontend/app/(authenticated)/council/[id]/page.tsx` — port from `Thecouncilv1/src/app/pages/CouncilRun.tsx`:
    - 5.6.1 Add `"use client";` directive.
    - 5.6.2 Accept `params` prop: `{ params: Promise<{ id: string }> }` (Next.js App Router convention for dynamic routes). Unwrap with `const { id } = await params` or `use(params)` in a useEffect.
    - 5.6.3 Remove `useLocation()` and `location.state` pattern. Instead, fetch council data on mount: `useEffect(() => { getCouncil(id).then(setCouncilData) }, [id])`. Show a loading skeleton until data arrives.
    - 5.6.4 Replace hardcoded fallback values (`question`, `totalCycles`, `selectedModels`, `crownedModel`) with values derived from the fetched `councilData` (pull from `councilData.primaryPrompt`, `councilData.rounds.length`, `councilData.agents`, and the agent with `slot === "CROWN"`).
    - 5.6.5 Update model display: `orderedModels` should map `councilData.agents` to the `AVAILABLE_MODELS` entries (match by `modelKey` or `displayName`). Fall back to agent `displayName` and `specialty` if no match.
    - 5.6.6 Keep `getFakeMessage` and the simulated relay logic, but gate it behind `process.env.NEXT_PUBLIC_USE_MOCK_RELAY === "true"`. When mock relay runs, call `saveDebateMessage()` from `@/lib/api` after each fake message is generated.
    - 5.6.7 Add a real relay path (gated by `NEXT_PUBLIC_USE_MOCK_RELAY !== "true"`): call `triggerCouncilRun(id)` on mount, then poll with `pollCouncilMessages(id, lastSequence)` every 3–5 seconds. Append new messages to the log. Stop polling when council status is `"COMPLETED"`.
    - 5.6.8 Replace `useNavigate()` → `useRouter()` from `next/navigation`. Update `navigate("/new")` → `router.push("/new")`.
    - 5.6.9 Update progress bar to advance based on completed steps (messages received) rather than fixed time. Use indeterminate spinner for the currently-active model.
    - 5.6.10 When council finishes (all cycles done), call `completeCouncil(id, finalSummary)` from `@/lib/api` to update the DB.
    - 5.6.11 Update image references: model images come from `AVAILABLE_MODELS[].img` which now point to `/images/*.png` (public folder paths, no import needed).
- 6.0 Integration Testing & Cleanup
  - 6.1 Run `npm run dev` from `frontend/` and verify the app compiles and loads without build errors.
  - 6.2 Test the login page: verify the page renders at `/login`, the email/password form displays correctly, error modals appear for empty fields and bad credentials.
  - 6.3 Test Supabase sign-up: create a new account, verify redirect to `/`, verify the user session persists (refresh the page — should stay on dashboard, not redirect to login).
  - 6.4 Test Supabase login: log out, log back in with the created account, verify redirect to `/`.
  - 6.5 Test auth guard: while logged out, navigate directly to `/` — verify redirect to `/login`. Repeat for `/new` and `/council/some-id`.
  - 6.6 Test the dashboard: verify the welcome card renders, "Start New Conversation" links to `/new`, sidebar shows "Previous Debates" (mock list or real from DB).
  - 6.7 Test the sidebar: verify brand header, search placeholder, "New Council" button, previous debates list, active route highlighting, and logout button all work.
  - 6.8 Test the setup page: verify model selection (select 3+), crown designation, question input with validation (must contain `?`), cycle selector, and "Launch Council" button. Verify it creates a council record and redirects to `/council/[id]`.
  - 6.9 Test the council run page: verify it loads by ID, displays the debate stage visualization, runs the mock relay (if `NEXT_PUBLIC_USE_MOCK_RELAY=true`), shows messages in the council log, and displays the final answer modal on completion.
  - 6.10 Test responsive layout: resize to below `lg` breakpoint — verify sidebar hides on mobile, pages stack vertically.
  - 6.11 Visual parity check: compare brand colors (#002D72, #007749, #F59E0B), typography, spacing, border-radius, shadows, and animations against the original Vite prototype running from `Thecouncilv1/`.
  - 6.12 Run `grep -r "react-router" frontend/` — verify zero results. No React Router imports should remain.
  - 6.13 Run `grep -r "from \"react-router" frontend/ && grep -r "from 'react-router" frontend/` — double-check with both quote styles.
  - 6.14 Remove the `Thecouncilv1/` directory entirely (`rm -rf Thecouncilv1/`). The old Vite project is no longer needed.
  - 6.15 Remove `Thecouncilv1/` related entries from root `.gitignore` if any exist.
  - 6.16 Run `npm run dev` again after deletion — verify the Next.js app still works with no references to `Thecouncilv1/`.
  - 6.17 Run `npm run build` from `frontend/` — verify the production build succeeds without errors.
  - 6.18 Commit all changes on `feature/design-integration`.
  - 6.19 Push and open PR into `BE-FE-Integration`. In the PR description, note: (a) `frontend/` replaces the boilerplate with the full ported UI, (b) `backend/` is untouched — no conflicts expected, (c) Supabase env vars must be set in `frontend/.env.local`.

