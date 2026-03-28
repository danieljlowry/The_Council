# PRD: Migrate Front-End from Vite/React Router into Next.js + Supabase Monorepo

**Status:** Draft
**Priority:** Urgent (Hackathon deadline — 1–2 days)
**Branch Source:** `feature/design-integration` → merge into `BE-FE-Integration`
**Date:** 2026-03-28

---

## 1. Introduction / Overview

The Council is an EagleHacks 2026 hackathon project — a multi-agent AI debate platform where users pose a question to a "council" of LLMs (GPT-5, Claude, Llama, Gemini) that take turns reasoning through it in relay fashion.

The front-end team built a complete, polished UI prototype on the `feature/design-integration` branch using **Vite + React 18 + React Router 7**. It lives in `Thecouncilv1/` and uses mock data (hardcoded `admin/admin` auth, fake debate messages via `setTimeout`).

The back-end team built the data layer on the `BE-FE-Integration` branch: a **Next.js 15 + Supabase** monorepo (`frontend/` + `backend/`) with Prisma ORM, PostgreSQL on Supabase, real auth plumbing, and a full database schema — but only a boilerplate placeholder page in the front-end.

**This PRD defines the work to migrate the existing front-end UI into the Next.js monorepo structure**, adapting it to work with Supabase Auth and the backend team's data models, so it can be merged into `BE-FE-Integration`.

---

## 2. Goals

1. **Port all front-end pages and components** from `Thecouncilv1/src/` (Vite/React Router) into `frontend/app/` (Next.js 15 App Router).
2. **Replace mock authentication** with Supabase email/password auth using the existing helpers in `frontend/utils/supabase/`.
3. **Align front-end data shapes** with the Prisma schema (Council, CouncilAgent, CouncilRound, DebateMessage) so the UI is ready to consume real API data.
4. **Use Supabase client SDK directly** (with RLS) for CRUD operations on councils, agents, rounds, and messages — no separate API layer needed for data access.
5. **Define the orchestration interface** for the OpenRouter-backed debate relay so the backend team can implement the `/api/council/[id]/run` endpoint.
6. **Preserve the existing design and UX** — brand colors (#002D72 cobalt, #007749 emerald, #F59E0B amber), Tailwind v4 theme tokens, and component styling must carry over intact.

---

## 3. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|------------|----------|
| US-1 | New user | Sign up with email and password on the login page | I get a Supabase account and a `profiles` row |
| US-2 | Returning user | Log in with my email and password | I'm authenticated and redirected to the dashboard |
| US-3 | Logged-in user | See my dashboard with a list of previous councils in the sidebar | I can resume or review past debates |
| US-4 | Logged-in user | Create a new council by selecting 3–4 models, designating a crown, writing a question, and choosing cycle count | A council record is created and the debate can begin |
| US-5 | Logged-in user | Watch the council debate unfold in real time with a progress bar and council log | I can follow the relay reasoning process |
| US-6 | Logged-in user | View the final synthesized answer after all cycles complete | I get the council's conclusion |
| US-7 | Logged-in user | Log out | My session ends and I'm redirected to login |

---

## 4. Functional Requirements

### 4.1 Project Structure Migration

| # | Requirement |
|---|-------------|
| FR-1 | Remove the `Thecouncilv1/` directory from the target branch. All front-end code must live under `frontend/`. |
| FR-2 | Adopt Next.js 15 App Router file-based routing. The route map is: |

**Route Map (Next.js file structure):**

```
frontend/
├── app/
│   ├── layout.tsx              # RootLayout (html, body, global providers)
│   ├── globals.css             # Tailwind v4 imports + theme tokens
│   ├── login/
│   │   └── page.tsx            # Login/Sign-up page (Client Component)
│   ├── (authenticated)/
│   │   ├── layout.tsx          # Sidebar + Outlet layout (auth-guarded)
│   │   ├── page.tsx            # Dashboard
│   │   ├── new/
│   │   │   └── page.tsx        # Setup / Configure Council
│   │   └── council/
│   │       └── [id]/
│   │           └── page.tsx    # CouncilRun (debate view)
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Sidebar.tsx
│   └── ui/                     # Radix/shadcn primitives (port selectively — only what's actually used)
├── lib/
│   ├── types.ts                # Shared TypeScript types aligned with Prisma schema
│   ├── api.ts                  # API client functions (stubs calling future endpoints)
│   ├── models.ts               # AVAILABLE_MODELS constant + model images
│   └── utils.ts                # cn() helper, brand color constants
├── utils/
│   └── supabase/               # Already exists on BE branch (client.ts, server.ts, middleware.ts)
├── assets/                     # Model logos (Chatgpt.png, Claude.png, etc.) + profile.png
├── middleware.ts                # Already exists — Supabase session refresh
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

| # | Requirement |
|---|-------------|
| FR-3 | Install required dependencies not yet in the BE branch's `frontend/package.json`: `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`. Radix primitives only if specific `ui/` components are ported. |
| FR-4 | Configure the `@/` path alias (already in `tsconfig.json` on BE branch as `@/* → ./*`). Vite's `@ → ./src` references must be updated to `@ → ./` (root-relative within `frontend/`). |

### 4.2 Authentication

| # | Requirement |
|---|-------------|
| FR-5 | The Login page (`/login`) must use Supabase email/password auth via the existing `createClient()` from `utils/supabase/client.ts`. |
| FR-6 | **Sign Up** calls `supabase.auth.signUp({ email, password })`. On success, redirect to `/`. A Supabase DB trigger on `auth.users` insert automatically creates the `profiles` row — the front-end does NOT need to handle this. |
| FR-7 | **Login** calls `supabase.auth.signInWithPassword({ email, password })`. On success, redirect to `/`. On failure, show the existing error modal UI. |
| FR-8 | **Log Out** calls `supabase.auth.signOut()` and redirects to `/login`. |
| FR-9 | The authenticated layout (`(authenticated)/layout.tsx`) must check the session server-side. If no valid session, redirect to `/login`. Use the `createClient()` from `utils/supabase/server.ts` with `cookies()`. |
| FR-10 | The Login page UI must change the "Username" field to "Email" (Supabase auth uses email, not username). Keep the password field, show/hide toggle, and error modals as-is. |

### 4.3 Dashboard Page

| # | Requirement |
|---|-------------|
| FR-11 | The Dashboard (`/`) must render the same welcome card with the "Start New Conversation" CTA linking to `/new`. |
| FR-12 | The right panel ("Council Log" empty state) remains as-is. |
| FR-13 | The Sidebar must display a list of the user's previous councils. For now, use a stub that returns mock data shaped like `Council[]` from `lib/types.ts`. When the backend provides an API, swap the stub. |

### 4.4 Setup Page (Configure Council)

| # | Requirement |
|---|-------------|
| FR-14 | The Setup page (`/new`) must port the complete model selection UI, crown designation, question input with validation, and cycle selector. |
| FR-15 | On "Launch Council", the page must call `createCouncil(...)` from `lib/api.ts` (Supabase direct insert) with: `{ title: string, primaryPrompt: string, agents: { slot: AgentSlot, displayName: string, specialty: string, modelKey: string }[], cycleCount: number }`. |
| FR-16 | On success, redirect to `/council/[id]` using the returned council UUID (use `router.push()`). |
| FR-17 | Replace `react-router`'s `navigate(..., { state })` pattern with URL-based navigation (`/council/[id]`). The CouncilRun page will fetch data by ID instead of reading `location.state`. |

### 4.5 Council Run Page (Debate View)

| # | Requirement |
|---|-------------|
| FR-18 | The CouncilRun page (`/council/[id]`) must render the full debate visualization: stage area with model avatars, progress bar, council log with chat bubbles, typing indicators, and the final answer modal. |
| FR-19 | The page must fetch council data by `id` from an API stub (`getCouncil(id)`) on mount. This returns the council config (question, agents, rounds, messages). |
| FR-20 | **For the hackathon demo:** Keep the simulated relay (`getFakeMessage`) as a fallback when no real orchestration API is available. Remove fixed `setTimeout` delays — instead, use an **indeterminate spinner/pulse per model step**. The progress bar must advance based on **completed steps**, not elapsed time. The simulation should still write results to the DB via `saveDebateMessage(...)` after each step. |
| FR-21 | Define an **orchestration interface** (see Section 7.3) for the OpenRouter-backed debate relay. The UI code must be structured so swapping from mock to real is a single toggle (`NEXT_PUBLIC_USE_MOCK_RELAY=true`). When `false`, call `POST /api/council/[id]/run` and poll for or stream new messages. Since model response latency is unpredictable, the UI must show an indeterminate "thinking" state per agent (no time-based progress assumptions). |

### 4.6 Sidebar & Layout

| # | Requirement |
|---|-------------|
| FR-22 | Port the `Sidebar` component into the authenticated layout. It must use Next.js `<Link>` instead of React Router's `<Link>`. |
| FR-23 | The "Previous Debates" list must consume data from a `getCouncils()` API stub. Shape: `{ id: string, title: string, status: CouncilStatus }[]`. |
| FR-24 | Active route highlighting must use `usePathname()` from `next/navigation` instead of `useLocation()` from `react-router`. |

### 4.7 Styling & Assets

| # | Requirement |
|---|-------------|
| FR-25 | Port `theme.css` (CSS custom properties / shadcn tokens) into `globals.css` or a separate import within `globals.css`. |
| FR-26 | Port `styles.css` (keyframe animations: `fadeIn`, `popIn`) into `globals.css`. |
| FR-27 | Copy image assets (`Chatgpt.png`, `Claude.png`, `Gemini.png`, `OLlama.png`, `profile.png`) into `frontend/public/` or `frontend/assets/` and update import paths. If using `public/`, reference as `/Chatgpt.png` etc. |
| FR-28 | Ensure `tw-animate-css` is installed and imported if any `animate-in` utilities are used. |

---

## 5. Non-Goals (Out of Scope)

| # | Explicitly out of scope |
|---|-------------------------|
| NG-1 | Implementing the actual AI orchestration backend (calling OpenRouter). The backend team owns the `/api/council/[id]/run` endpoint. We only define the interface and consume it. |
| NG-2 | Building the orchestration API Route. The backend team owns this. The front-end uses Supabase direct for CRUD and calls the backend's orchestration endpoint for debate relay. |
| NG-3 | OAuth providers (Google, GitHub). Email/password auth only for now. |
| NG-4 | Porting unused Radix/shadcn `ui/` components. Only port components that are actively imported by the 4 pages. |
| NG-5 | Mobile-first responsive redesign. Current responsive behavior (lg breakpoints) is preserved, not improved. |
| NG-6 | Implementing real-time WebSocket/SSE streaming for debate messages. The mock relay is sufficient for the hackathon. |
| NG-7 | Search functionality in the sidebar (currently non-functional placeholder — keep as-is). |
| NG-8 | Writing Prisma migrations or modifying the database schema. |

---

## 6. Design Considerations

### Brand Identity (Preserve Exactly)
- **Cobalt Primary:** `#002D72`
- **Emerald Accent:** `#007749`
- **Amber Warning:** `#F59E0B` / `#B45309`
- **Neutrals:** `#1e1e1e`, `#757575`, `#b3b3b3`, `#d9d9d9`, `#e5e5e5`, `#f5f5f5`, `#fcfcfc`

### Component Library
- `Button` (variants: primary, secondary, outline, ghost, danger/success)
- `Input` and `Textarea`
- `Sidebar` (brand header, search, new council CTA, debates list, user profile/logout)
- All use `cn()` (clsx + tailwind-merge)

### Page-Level UX (No Changes)
- **Login:** Card-centered layout with cobalt header gradient, login/signup toggle, error modals, prototype hint
- **Dashboard:** Welcome hero with gradient background accents, right panel empty state
- **Setup:** Two-column layout — left workspace (model sequence cards, question form) + right helper panel
- **CouncilRun:** Two-column — left stage visualization (gradient arena with model avatars) + right council log (chat bubbles with typing indicator)

---

## 7. Technical Considerations

### 7.1 TypeScript Types (aligned with Prisma schema)

These types go in `frontend/lib/types.ts` and mirror the Prisma models:

```typescript
export type CouncilStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type AgentSlot = "CROWN" | "AGENT_B" | "AGENT_C" | "AGENT_D";
export type DebateMessageAuthor = "USER" | "AGENT";

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Council {
  id: string;
  ownerId: string;
  title: string;
  primaryPrompt: string;
  status: CouncilStatus;
  finalSummary: string | null;
  createdAt: string;
  updatedAt: string;
  agents?: CouncilAgent[];
  rounds?: CouncilRound[];
}

export interface CouncilAgent {
  id: string;
  councilId: string;
  slot: AgentSlot;
  displayName: string;
  specialty: string;
  modelKey: string | null;
  createdAt: string;
}

export interface CouncilRound {
  id: string;
  councilId: string;
  number: number;
  userFeedback: string | null;
  memorySummary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  messages?: DebateMessage[];
}

export interface DebateMessage {
  id: string;
  councilId: string;
  roundId: string;
  councilAgentId: string | null;
  author: DebateMessageAuthor;
  sequence: number;
  content: string;
  createdAt: string;
}
```

### 7.2 API Client Layer (`frontend/lib/api.ts`)

Since Supabase RLS is configured, the front-end uses the **Supabase client SDK directly** for CRUD operations. The `lib/api.ts` module wraps Supabase queries in typed helper functions for consistency. Only the orchestration endpoint (kicking off the debate relay) requires an API Route because it needs server-side OpenRouter secrets.

```typescript
import { createClient } from "@/utils/supabase/client";

// Council CRUD (Supabase direct — RLS enforces ownership)
async function createCouncil(data: {
  title: string;
  primaryPrompt: string;
  agents: { slot: AgentSlot; displayName: string; specialty: string; modelKey: string }[];
  cycleCount: number;
}): Promise<{ id: string }>
// Implementation: insert into "councils", then insert into "council_agents",
// then insert N "council_rounds" rows. All via supabase.from(...).insert(...)

async function getCouncil(id: string): Promise<Council & {
  agents: CouncilAgent[];
  rounds: (CouncilRound & { messages: DebateMessage[] })[];
}>
// Implementation: supabase.from("councils").select("*, council_agents(*), council_rounds(*, debate_messages(*))").eq("id", id).single()

async function listCouncils(): Promise<Pick<Council, "id" | "title" | "status" | "createdAt">[]>
// Implementation: supabase.from("councils").select("id, title, status, created_at").order("created_at", { ascending: false })

// Debate messages (Supabase direct)
async function saveDebateMessage(data: {
  councilId: string;
  roundId: string;
  councilAgentId: string;
  author: DebateMessageAuthor;
  sequence: number;
  content: string;
}): Promise<{ id: string }>
// Implementation: supabase.from("debate_messages").insert(...)

// Council lifecycle (Supabase direct)
async function startCouncilRound(councilId: string, roundNumber: number): Promise<{ roundId: string }>
async function completeCouncil(councilId: string, finalSummary: string): Promise<void>
// Implementation: supabase.from("councils").update({ status: "COMPLETED", final_summary: finalSummary }).eq("id", councilId)
```

> **Note:** Supabase table/column names use `snake_case` (e.g., `council_agents`, `primary_prompt`). The TypeScript interfaces in `lib/types.ts` use `camelCase`. The `api.ts` helpers handle the mapping.

### 7.3 Orchestration Interface (Debate Relay via OpenRouter)

The backend team will build an API Route that orchestrates the debate relay through **OpenRouter**. The front-end calls this endpoint and receives model responses. Since latency per model is unpredictable, the front-end must handle variable wait times gracefully.

**Option A — Polling (simplest for hackathon):**
```
POST /api/council/[id]/run
  → Kicks off the relay via OpenRouter. Returns 202 Accepted.
  → Backend calls OpenRouter for each agent in sequence, writes DebateMessage rows to Supabase.

GET  /api/council/[id]/messages?after=[sequence]
  → Returns new DebateMessage[] since the given sequence number.
  → Front-end polls every 3–5 seconds until council status = COMPLETED.
```

**Option B — Server-Sent Events (better UX):**
```
GET /api/council/[id]/stream
  → SSE stream. Backend calls OpenRouter per agent, streams each response as it arrives.
  → Event types: "message" (new DebateMessage), "round_complete", "council_complete"
  → No timeout — the stream stays open until the council finishes.
```

The front-end CouncilRun page must support both modes, switchable via `NEXT_PUBLIC_USE_MOCK_RELAY`. When `true`, the page uses the local `getFakeMessage` simulation. When `false`, it calls the real orchestration endpoint.

> **OpenRouter note:** The backend API Route holds the `OPENROUTER_API_KEY` server-side. The front-end never calls OpenRouter directly. The `modelKey` field on `CouncilAgent` (e.g., `"openai/gpt-5"`, `"anthropic/claude-3.5-sonnet"`) tells the backend which OpenRouter model to invoke.

### 7.4 Mapping: Current UI Concepts → Prisma Schema

| UI Concept | Prisma Model / Field |
|------------|---------------------|
| Selected models array | `CouncilAgent[]` (one row per model, `slot` = CROWN / AGENT_B / AGENT_C / AGENT_D) |
| Crowned model | `CouncilAgent` with `slot = CROWN` |
| Model ID (`gpt-5`, `claude`, etc.) | `CouncilAgent.modelKey` (maps to OpenRouter model identifiers, e.g., `"openai/gpt-5"`, `"anthropic/claude-3.5-sonnet"`) |
| Model display name | `CouncilAgent.displayName` |
| Model role ("Generalist", "Realist") | `CouncilAgent.specialty` |
| Debate question | `Council.primaryPrompt` |
| Number of cycles | Derived from `CouncilRound` count (create N rounds upfront or on-the-fly) |
| Each model's response in a cycle | `DebateMessage` (linked to `CouncilRound` + `CouncilAgent`) |
| Final answer text | `Council.finalSummary` |
| Previous chats in sidebar | `Council[]` filtered by `ownerId` |
| Council status | `Council.status` (DRAFT → ACTIVE → COMPLETED) |

### 7.5 Key Migration Patterns

| React Router Pattern | Next.js Equivalent |
|---------------------|-------------------|
| `createBrowserRouter` + `RouterProvider` | File-based routing in `app/` directory |
| `<Link to="/new">` from `react-router` | `<Link href="/new">` from `next/link` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `useLocation()` | `usePathname()` + `useSearchParams()` from `next/navigation` |
| `useParams()` | `params` prop on page component (App Router) |
| `navigate("/path", { state })` | `router.push("/path")` (no state — use URL params or fetch by ID) |
| `<Outlet />` | `{children}` in layout.tsx |

### 7.6 Environment Variables

```env
# frontend/.env.local — Supabase credentials (project already exists; add manually)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-anon-key>

# Feature toggle for mock vs. real debate relay
NEXT_PUBLIC_USE_MOCK_RELAY=true

# backend/.env — server-side only (backend team manages)
# DATABASE_URL=...
# DIRECT_URL=...
# OPENROUTER_API_KEY=...   ← used by the orchestration API Route, never exposed to the client
```

### 7.7 Dependencies to Add

```json
{
  "lucide-react": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "class-variance-authority": "latest",
  "tw-animate-css": "latest"
}
```

---

## 8. Implementation Plan (Ordered Tasks)

Given the urgent timeline (1–2 days), tasks are ordered by dependency and priority.

### Phase 1: Scaffolding (Estimated: 1–2 hours)

- [ ] **Task 1.1** — Check out `BE-FE-Integration`, create a working branch off it (e.g., `feature/fe-integration`).
- [ ] **Task 1.2** — Install new dependencies in `frontend/` (`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`).
- [ ] **Task 1.3** — Copy image assets from `Thecouncilv1/src/assets/` into `frontend/public/images/`.
- [ ] **Task 1.4** — Create `frontend/lib/types.ts` with TypeScript interfaces (Section 7.1).
- [ ] **Task 1.5** — Create `frontend/lib/utils.ts` with `cn()` helper and brand color constants.
- [ ] **Task 1.6** — Create `frontend/lib/models.ts` with `AVAILABLE_MODELS` constant (4 models, fixed for hackathon). Update image paths to `/images/Chatgpt.png` etc. Add OpenRouter model identifiers to each entry (e.g., `modelKey: "openai/gpt-5"`). In the future, this list will be fetched from a backend config endpoint.
- [ ] **Task 1.7** — Merge theme CSS tokens and keyframe animations into `frontend/app/globals.css`.
- [ ] **Task 1.8** — Create `frontend/lib/api.ts` with Supabase-direct query functions for CRUD (councils, agents, rounds, messages). Include the orchestration call signature (`POST /api/council/[id]/run`) as a placeholder.

### Phase 2: Shared Components (Estimated: 1 hour)

- [ ] **Task 2.1** — Port `Button.tsx` → `frontend/components/Button.tsx` (no changes needed beyond import paths).
- [ ] **Task 2.2** — Port `Input.tsx` (+ `Textarea`) → `frontend/components/Input.tsx`.
- [ ] **Task 2.3** — Port `Sidebar` → `frontend/components/Sidebar.tsx`. Replace `react-router` `Link`/`useLocation`/`useNavigate` with Next.js equivalents. Wire logout to `supabase.auth.signOut()`.
- [ ] **Task 2.4** — Port any used `ui/` components (check if accordion, dialog, etc. are actually imported by pages — likely none are).

### Phase 3: Pages (Estimated: 3–4 hours)

- [ ] **Task 3.1** — **Login page** (`frontend/app/login/page.tsx`): Port `Login.tsx` as a Client Component (`"use client"`). Change username to email. Replace mock auth with `supabase.auth.signInWithPassword()` / `.signUp()`. Redirect via `router.push("/")`.
- [ ] **Task 3.2** — **Authenticated layout** (`frontend/app/(authenticated)/layout.tsx`): Server Component that checks `supabase.auth.getUser()` — redirect to `/login` if unauthenticated. Renders `<Sidebar />` + `{children}`.
- [ ] **Task 3.3** — **Dashboard** (`frontend/app/(authenticated)/page.tsx`): Port `Dashboard.tsx`. Replace React Router `<Link>` with Next.js `<Link>`. Minimal changes.
- [ ] **Task 3.4** — **Setup page** (`frontend/app/(authenticated)/new/page.tsx`): Port `Setup.tsx` as Client Component. Replace `useNavigate` with `useRouter`. On submit, call `createCouncil()` stub and redirect to `/council/[id]`.
- [ ] **Task 3.5** — **CouncilRun page** (`frontend/app/(authenticated)/council/[id]/page.tsx`): Port `CouncilRun.tsx` as Client Component. Read `id` from params. Fetch council data from `getCouncil(id)` stub on mount. Keep simulated relay as default. Structure code to swap for real API later (env var toggle).

### Phase 4: Integration & Polish (Estimated: 1–2 hours)

- [ ] **Task 4.1** — Verify all routes work: `/login` → sign up → `/` → `/new` → configure → `/council/[id]` → debate → finish → back to `/`.
- [ ] **Task 4.2** — Verify Supabase auth flow end-to-end (sign up, login, session persistence, logout, redirect guards).
- [ ] **Task 4.3** — Verify the sidebar shows correctly, route highlighting works, and "New Council" button navigates properly.
- [ ] **Task 4.4** — Test responsive behavior at `lg` breakpoint (sidebar hidden on mobile).
- [ ] **Task 4.5** — Clean up any remaining `react-router` imports, unused dependencies, or dead code.
- [ ] **Task 4.6** — Update `frontend/package.json` description if needed.
- [ ] **Task 4.7** — Commit, push, and open PR into `BE-FE-Integration`.

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| All 4 pages render correctly in the Next.js app | Pass |
| Supabase sign-up creates account + login works | Pass |
| Auth guards redirect unauthenticated users to `/login` | Pass |
| Full user flow (login → dashboard → setup → council run → finish) works end-to-end | Pass |
| No `react-router` imports remain in `frontend/` | Pass |
| Supabase-direct CRUD helpers in `lib/api.ts` work with RLS (create/read councils, agents, messages) | Pass |
| Orchestration interface is clearly defined so backend team can implement `/api/council/[id]/run` without front-end changes | Pass |
| Brand colors, typography, spacing, and animations match the original Vite prototype | Visual parity |
| PR merges cleanly into `BE-FE-Integration` with no conflicts in `backend/` | Pass |

---

## 10. Open Questions (Resolved)

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| OQ-1 | API Routes vs. Server Actions vs. Supabase direct? | **API Routes or Supabase direct — no preference.** Since RLS is configured (OQ-4), the front-end will use **Supabase client SDK directly** for reads and simple writes. API Routes are reserved for orchestration or any logic that needs server-side secrets. | `lib/api.ts` stubs should use `supabase.from("councils").select(...)` etc. directly. |
| OQ-2 | How is the `profiles` row created on sign-up? | **Supabase DB trigger on `auth.users` insert.** | Front-end does NOT need to create a profile row after sign-up. Just call `supabase.auth.signUp()` and the trigger handles it. |
| OQ-3 | Orchestration backend: OpenRouter or direct model calls? | **OpenRouter.** | The orchestration API will proxy through OpenRouter. The SSE/polling stream from the backend returns model responses; the front-end doesn't call OpenRouter directly. |
| OQ-4 | Are Supabase RLS policies configured? | **Yes.** | The front-end can use the Supabase client SDK directly for CRUD on councils, agents, rounds, and messages — RLS ensures users only see their own data. |
| OQ-5 | Is the model list fixed or dynamic? | **4 models fixed for hackathon.** Model config is pulled from a backend config (not a DB table). | Keep `AVAILABLE_MODELS` hardcoded in `lib/models.ts` for now. In the future, fetch from a backend config endpoint. |
| OQ-6 | Expected latency per model response? | **No fixed expectation — let it take as long as needed.** | Remove fixed `setTimeout` delays. Use an indeterminate progress indicator (spinner/pulse) per model step instead of a time-based progress bar. The progress bar should advance based on completed steps, not elapsed time. |
| OQ-7 | Are Supabase env vars available? | **Yes, Supabase project exists.** Credentials will be added manually to `frontend/.env.local`. | No setup needed. Document the required env var names in the README. |
