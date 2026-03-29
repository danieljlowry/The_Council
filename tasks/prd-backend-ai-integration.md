# PRD: Backend AI Orchestration Integration

## 1. Introduction / Overview

The Council is a multi-model AI debate platform where users pose a question and multiple LLMs discuss it in a sequential relay across 1–2 cycles. The frontend (Next.js 15 + Supabase) already supports creating councils, selecting models, and displaying a debate UI — but it currently runs on **mock data only**.

A separate branch (`small_AI_issue`) built by the backend team contains a working Fastify server with full OpenRouter-based AI orchestration: four specialized agents (Generalist → Implementation → Refiner → Evaluator) that pass a "baton" through exploration and refinement cycles. That orchestration code needs to be brought into the `feature/design-integration` branch and adapted to run as **Next.js API Route Handlers** so the frontend can trigger real AI debates with actual credentials.

**The problem**: The frontend has no working backend to call. The backend exists on a different branch with a different architecture (standalone Fastify) and different assumptions (it creates its own councils, uses fixed 4-model slots). This PRD defines how to merge and adapt the backend AI logic into the existing frontend branch.

## 2. Goals

1. **End-to-end real debates**: A user can create a council in the UI, click "Launch Council", and see actual LLM responses stream into the debate log — no mock mode required.
2. **Single-server deployment**: All orchestration runs inside Next.js API Route Handlers — no separate Fastify process.
3. **Preserve frontend design**: The existing UI, routing, Supabase auth, and styling remain intact.
4. **3–4 model flexibility**: Support the user's choice of 3 or 4 models. When 3 are selected, the evaluator/summarizer role (Model D) is skipped.
5. **Use budget-friendly model defaults**: Default OpenRouter model keys from the backend branch (`openai/gpt-3.5-turbo`, `google/gemini-2.5-pro`, `anthropic/claude-3.5-haiku`, `qwen/qwen3-235b-a22b-2507`) are used for now. The user's frontend selection maps to whichever models they pick.

## 3. User Stories

**US-1**: As a user, I want to create a council by entering a question, selecting 3–4 models, and choosing 1–2 cycles, then have the backend create the council record and orchestrate the debate automatically so I see real AI responses appear in the debate log.

**US-2**: As a user, when I select only 3 models, the debate still runs correctly — the system skips the evaluator step and the last model's refined output becomes the final answer.

**US-3**: As a user, I want to revisit a completed council and see the full transcript of all AI responses, organized by cycle and model.

**US-4**: As a user, I want the debate to show real-time progress (which model is "thinking", which cycle we're on) even though the backend processes sequentially.

**US-5**: As a developer, I want the OpenRouter API key stored server-side only (never exposed to the client) and configurable via environment variable.

## 4. Functional Requirements

### 4.1 — Next.js API Route: Create & Run Council

**FR-1**: Create a Next.js Route Handler at `frontend/app/api/council/run/route.ts` that accepts a `POST` request with the following body:

```json
{
  "title": "string",
  "prompt": "string",
  "cycleCount": 1 | 2,
  "models": ["openrouter/model-id-1", "openrouter/model-id-2", ...]
}
```

**FR-2**: The route must authenticate the request using the Supabase server client (extract user from cookies/session). Reject with `401` if unauthenticated.

**FR-3**: The route must create the council record, council agents, and council rounds in the database using the Supabase server client (or Prisma — see Technical Considerations). The first model in the `models` array gets slot `CROWN`, subsequent models get `AGENT_B`, `AGENT_C`, `AGENT_D` in order.

**FR-4**: The route must orchestrate the AI relay synchronously (within the same request or via a background mechanism) following this logic, adapted from `small_AI_issue`'s `orchestrator.ts`:

- **Cycle 1 (Exploration)**: Model A (Crown) receives the user's prompt → Model B receives prompt + Model A's output → Model C receives prompt + Model B's output → Model D (if 4 models) receives prompt + Model C's output and returns a JSON evaluation.
- **Cycle 2 (Refinement)** (if `cycleCount === 2`): Model A receives the original prompt + Cycle 1's final output + evaluator feedback → relay continues as above.

**FR-5**: Each agent response must be saved as a `DebateMessage` row (author: `AGENT`) with an incrementing `sequence` number within the council.

**FR-6**: When the relay completes, update the council status to `COMPLETED` and write `final_summary` from the last evaluator's summary (or the last model's output if only 3 models).

**FR-7**: The route must return the completed council data including all messages, or at minimum the `councilId` so the frontend can fetch the result.

### 4.2 — Next.js API Route: Poll Messages

**FR-8**: Create a Next.js Route Handler at `frontend/app/api/council/[councilId]/messages/route.ts` that accepts a `GET` request with query param `after` (sequence number).

**FR-9**: Returns all `DebateMessage` rows for the council where `sequence > after`, ordered by sequence ascending. Must verify the requesting user owns the council.

### 4.3 — LLM Service Layer

**FR-10**: Port `small_AI_issue`'s `llm.ts` into the frontend codebase (e.g. `frontend/lib/server/llm.ts`) as a server-only module. It must:
- Read `OPENROUTER_API_KEY` from `process.env` (server-side only).
- Call `https://openrouter.ai/api/v1/chat/completions` with the given model and prompt.
- Read `OPENROUTER_MAX_TOKENS` from env (default 2048).
- Return the response content string.
- Throw descriptive errors on failure.

### 4.4 — Agent Modules

**FR-11**: Port the four agent modules (`modelA.ts`, `modelB.ts`, `modelC.ts`, `modelD.ts`) from `small_AI_issue` into `frontend/lib/server/agents/`. Preserve their prompt templates and exploration/refinement logic.

**FR-12**: Adapt each agent function signature to accept the OpenRouter model ID as a parameter (already the case in `small_AI_issue`), so the user's model selection from the frontend determines which LLM is called for each agent role.

**FR-13**: When only 3 models are selected, the orchestrator must skip Model D entirely. In this case:
- Cycle 1 ends after Model C's refined output (no evaluation step).
- The `final_summary` is Model C's output.
- If cycle 2 runs, Model A in cycle 2 receives Model C's cycle-1 output as context (without evaluator feedback, since there is none).

### 4.5 — Frontend Adaptation

**FR-14**: Update `frontend/lib/api.ts`:
- Replace `triggerCouncilRun()` to call `POST /api/council/run` with the council's prompt, title, cycle count, and model keys.
- Replace `pollCouncilMessages()` to call `GET /api/council/{councilId}/messages?after={sequence}`.
- **Remove or rework `createCouncil()`**: Since the backend now creates the council, the frontend's setup page should call the new `/api/council/run` endpoint directly instead of inserting into Supabase first.

**FR-15**: Update `frontend/app/(authenticated)/new/page.tsx`:
- On "Launch Council", call the new API route instead of `createCouncil()`.
- Navigate to `/council/{id}` with the returned council ID.

**FR-16**: Update `frontend/app/(authenticated)/council/[id]/page.tsx`:
- When `USE_MOCK_RELAY` is `false` (or removed entirely), the real relay path should:
  1. If the council status is `DRAFT` or just created, trigger the run via the API route.
  2. Poll for new messages every 2–3 seconds.
  3. Display each message as it appears in the log.
  4. Stop polling when status is `COMPLETED`.
- The mock relay path can remain behind a flag for development/demo purposes.

**FR-17**: Update `frontend/lib/models.ts` — update the `modelKey` values to match the backend's working defaults so they actually resolve on OpenRouter:

| Frontend ID | Current `modelKey` | Updated `modelKey` |
|---|---|---|
| gpt-5 | `openai/gpt-5` | `openai/gpt-3.5-turbo` |
| claude | `anthropic/claude-3.5-sonnet` | `anthropic/claude-3.5-haiku` |
| llama | `meta-llama/llama-3` | `meta-llama/llama-3` (keep) |
| gemini | `google/gemini-pro` | `google/gemini-2.5-pro` |
| qwen | `qwen/qwen-2.5` | `qwen/qwen3-235b-a22b-2507` |

### 4.6 — Environment Variables

**FR-18**: Add the following to `frontend/.env.local` (document in README):
- `OPENROUTER_API_KEY` — required, server-side only, never prefixed with `NEXT_PUBLIC_`.
- `OPENROUTER_MAX_TOKENS` — optional, defaults to `2048`.

### 4.7 — Backend Package Dependencies

**FR-19**: No separate backend server is needed. However, the Next.js app needs the Prisma client (or Supabase server client) to write to the database from API routes. Ensure `@prisma/client` is available or that the Supabase server client is used consistently for all DB operations in the Route Handlers.

## 5. Non-Goals (Out of Scope)

1. **Streaming responses**: For this integration, we do not implement SSE/WebSocket streaming of individual tokens. The backend completes each model call fully, saves it, and the frontend polls for new messages.
2. **User feedback between rounds**: The `userFeedback` field on `CouncilRound` exists in the schema but is not used in this integration. Cycle 2 auto-starts after cycle 1 without user input.
3. **Custom agent prompts**: Users cannot edit agent system prompts in the UI. The hardcoded prompt templates from `small_AI_issue` are used as-is.
4. **Rate limiting / cost controls**: No per-user rate limiting or token budgeting.
5. **Error recovery / retry**: If an LLM call fails mid-relay, the council is left in a failed state. No automatic retry or partial-completion resume.
6. **Docker / deployment config**: No containerization or CI/CD changes.
7. **Removing mock mode entirely**: The mock relay flag stays for development convenience.

## 6. Design Considerations

### UI Impact
- The setup page (`/new`) flow changes minimally — the user still picks models, enters a question, and clicks "Launch Council". The difference is that the POST now goes to an API route instead of directly inserting into Supabase.
- The council run page (`/council/[id]`) behavior improves — instead of fake delays, the loading states reflect actual OpenRouter call times (typically 3–15 seconds per model).
- The "Final Council Response" modal should display the evaluator's summary when 4 models are used, or the refiner's output when 3 models are used.

### Component Changes
- No new UI components are needed. The existing progress bar, model avatars, council log, and modal all work with the real data shape.

## 7. Technical Considerations

### Architecture: Next.js Route Handlers
The orchestration logic from `small_AI_issue`'s Fastify server is ported into Next.js App Router API routes (`frontend/app/api/...`). This means:
- No separate process to manage.
- Server-side env vars (`OPENROUTER_API_KEY`) are naturally available.
- Supabase server client can authenticate requests using cookies.
- **Caveat**: Long-running requests (4 sequential LLM calls × 2 cycles = up to 8 calls) may hit Vercel's serverless function timeout (default 10s on Hobby, 60s on Pro). For local development this is fine. For production, consider moving to a background job or edge function with streaming.

### Database Access from Route Handlers
Two options exist:
- **Option A (Recommended for speed)**: Use the Supabase server client (`createClient` from `@/utils/supabase/server`) in Route Handlers, same pattern as the frontend but server-side. This avoids needing Prisma runtime in the Next.js bundle.
- **Option B**: Use `@prisma/client` directly in Route Handlers. Requires adding Prisma to the frontend's dependencies and generating the client.

### File Organization for Server-Only Code
All ported backend code lives under `frontend/lib/server/`:
```
frontend/lib/server/
├── llm.ts                 # OpenRouter API client (from small_AI_issue llm.ts)
├── orchestrator.ts        # Debate engine (from small_AI_issue orchestrator.ts)
├── agents/
│   ├── modelA.ts          # Generalist agent
│   ├── modelB.ts          # Implementation agent
│   ├── modelC.ts          # Refiner agent
│   └── modelD.ts          # Evaluator agent (skipped when 3 models)
└── types.ts               # CyclePhase, CycleCount, ModelLineup types
```

### Mapping Frontend Model Selection → Backend Agent Roles
The user picks 3–4 models in order. The mapping is positional:
- 1st model → Agent A (Generalist / Crown)
- 2nd model → Agent B (Implementation)
- 3rd model → Agent C (Refiner)
- 4th model (if present) → Agent D (Evaluator)

The OpenRouter model ID from the user's selection is passed to each agent function, overriding any defaults.

### Key Adaptation: Council Creation Ownership
On `small_AI_issue`, the `POST /debate` endpoint creates the council, agents, rounds, AND runs the orchestration in one call. We replicate this in the Next.js route: the `/api/council/run` handler creates all DB records and then runs the relay. The frontend setup page no longer inserts into Supabase directly — it just POSTs to the API route.

### Key Adaptation: Persistence Layer
`small_AI_issue`'s `persistence.ts` uses Prisma directly. The ported version should use the Supabase server client instead, calling `.from("councils").insert(...)` etc., to stay consistent with the rest of the frontend codebase and avoid adding Prisma as a runtime dependency to the Next.js app.

### Reference: Logic Architecture (from logic.md)
The orchestration follows a **two-round, sequential relay of specialized models, led by a crown model**:
- **Layer 1**: Immutable `primaryPrompt` — anchors every call.
- **Layer 2**: Recent baton/transcript for the current round — each model receives the previous model's output.
- **Layer 3**: Compressed `memorySummary` from previous round(s) — carried into cycle 2 via the evaluator's output.

Pseudocode:
```ts
for (round = 1; round <= cycleCount; round++) {
  let baton = round === 1 ? primaryPrompt : buildCycle2Input(primaryPrompt, cycle1Results);

  for (agent of [A, B, C, D?]) {
    const response = await callAgent(agent, baton, round);
    saveMessage(round, agent, response);
    baton = response;
  }

  saveRoundSummary(round);
}

finalSummary = lastAgentOutput;
completeCouncil(finalSummary);
```

## 8. Success Metrics

1. **Functional**: A user can create a council with 3 or 4 models, run 1 or 2 cycles, and see real LLM responses from OpenRouter appear in the debate log.
2. **Data integrity**: All debate messages are persisted in Supabase with correct `council_id`, `round_id`, `council_agent_id`, `sequence`, and `author` values.
3. **Resumability**: Navigating away and back to `/council/[id]` correctly loads the persisted transcript and shows the council as completed.
4. **No regressions**: Mock mode still works when the flag is enabled. Existing login, signup, sidebar, settings, and theme toggle are unaffected.
5. **Security**: `OPENROUTER_API_KEY` is never sent to the client (no `NEXT_PUBLIC_` prefix, not present in client bundles).

## 9. Open Questions

1. **Vercel timeout**: If deployed to Vercel, the synchronous relay (up to 8 LLM calls) may exceed the serverless function timeout. Should we plan for a background job pattern (e.g., Supabase Edge Functions, or a webhook-based queue) as a follow-up?
2. **OpenRouter model availability**: Are the default model keys (`openai/gpt-3.5-turbo`, `google/gemini-2.5-pro`, etc.) confirmed active on the team's OpenRouter account? Some models may require specific plan access.
3. **Model D JSON parsing**: The evaluator (Model D) is expected to return structured JSON. If the LLM returns malformed JSON, the current code throws. Should we add a fallback (e.g., wrap the raw text in a default structure)?
4. **RLS policies**: Are Supabase Row Level Security policies in place for `councils`, `council_agents`, `council_rounds`, and `debate_messages`? The API route inserts as the authenticated user — RLS must allow this.
5. **3-model cycle 2 behavior**: When only 3 models are selected (no evaluator), cycle 2's Model A input currently relies on evaluator feedback. The PRD says to skip evaluator feedback and use Model C's output directly — is this acceptable or should cycle 2 be disabled for 3-model councils?

## Appendix A: Files to Port from `small_AI_issue`

| Source (small_AI_issue) | Destination (feature/design-integration) | Adaptation Needed |
|---|---|---|
| `backend/src/services/llm.ts` | `frontend/lib/server/llm.ts` | Remove verbose console.logs for production; keep error handling |
| `backend/src/services/orchestrator.ts` | `frontend/lib/server/orchestrator.ts` | Replace Prisma persistence calls with Supabase server client; add 3-model support (skip Model D) |
| `backend/src/agents/modelA.ts` | `frontend/lib/server/agents/modelA.ts` | Minimal — just update import paths |
| `backend/src/agents/modelB.ts` | `frontend/lib/server/agents/modelB.ts` | Minimal — just update import paths |
| `backend/src/agents/modelC.ts` | `frontend/lib/server/agents/modelC.ts` | Minimal — just update import paths |
| `backend/src/agents/modelD.ts` | `frontend/lib/server/agents/modelD.ts` | Minimal — just update import paths |
| `backend/src/types/debate.ts` | `frontend/lib/server/types.ts` | Merge with existing `frontend/lib/types.ts` or keep separate for server-only types |
| `backend/src/services/persistence.ts` | Rewritten inside orchestrator / route handler | Replace all `prisma.*` calls with Supabase server client equivalents |
| `backend/src/services/modelLineup.ts` | `frontend/lib/server/modelLineup.ts` | Adapt to accept 3–4 models instead of requiring exactly 4 |
| `backend/src/routes/debate.ts` | `frontend/app/api/council/run/route.ts` + `frontend/app/api/council/[councilId]/messages/route.ts` | Rewrite as Next.js Route Handlers with Supabase auth |

## Appendix B: Files to Modify on `feature/design-integration`

| File | Change |
|---|---|
| `frontend/lib/api.ts` | Replace `createCouncil()` with call to `/api/council/run`; update `triggerCouncilRun()` and `pollCouncilMessages()` |
| `frontend/lib/models.ts` | Update `modelKey` values to working OpenRouter model IDs |
| `frontend/app/(authenticated)/new/page.tsx` | Call new API route on "Launch Council" instead of direct Supabase inserts |
| `frontend/app/(authenticated)/council/[id]/page.tsx` | Wire up real relay path to use new API routes; keep mock mode behind flag |
| `frontend/.env.local` | Add `OPENROUTER_API_KEY` and optionally `OPENROUTER_MAX_TOKENS` |
