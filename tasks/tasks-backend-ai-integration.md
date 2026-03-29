# Tasks: Backend AI Orchestration Integration

> Implementation plan for [prd-backend-ai-integration.md](./prd-backend-ai-integration.md)
> Branch: `feature/design-integration`
> Source branch for porting: `origin/small_AI_issue`

## Relevant Files

### New Files to Create
- `frontend/lib/server/types.ts` - Server-only types ported from `small_AI_issue` (`CyclePhase`, `CycleCount`, `ModelLineup`, `AgentOutput`).
- `frontend/lib/server/llm.ts` - OpenRouter API client, ported from `backend/src/services/llm.ts` on `small_AI_issue`. Reads `OPENROUTER_API_KEY` from env.
- `frontend/lib/server/agents/modelA.ts` - Generalist agent (exploration + refinement prompts), ported from `backend/src/agents/modelA.ts`.
- `frontend/lib/server/agents/modelB.ts` - Implementation agent, ported from `backend/src/agents/modelB.ts`.
- `frontend/lib/server/agents/modelC.ts` - Refiner agent, ported from `backend/src/agents/modelC.ts`.
- `frontend/lib/server/agents/modelD.ts` - Evaluator/summarizer agent, ported from `backend/src/agents/modelD.ts`.
- `frontend/lib/server/modelLineup.ts` - Resolves user's model selection into a lineup object, adapted from `backend/src/services/modelLineup.ts` to support 3–4 models.
- `frontend/lib/server/persistence.ts` - Supabase-based persistence helpers (create council, save messages, complete council), rewritten from `backend/src/services/persistence.ts`.
- `frontend/lib/server/orchestrator.ts` - Core debate engine, ported from `backend/src/services/orchestrator.ts`. Rewired to use Supabase persistence and supports 3-model councils.
- `frontend/app/api/council/run/route.ts` - Next.js Route Handler: `POST` — authenticates user, creates council, runs AI relay, returns result.
- `frontend/app/api/council/[councilId]/messages/route.ts` - Next.js Route Handler: `GET` — polls debate messages after a given sequence number.

### Existing Files to Modify
- `frontend/lib/models.ts` - Update `modelKey` values to budget-friendly OpenRouter model IDs that actually work.
- `frontend/lib/api.ts` - Add `runCouncil()` function; update `triggerCouncilRun()` and `pollCouncilMessages()` to call new API routes; simplify or remove direct Supabase `createCouncil()`.
- `frontend/app/(authenticated)/new/page.tsx` - Change "Launch Council" to call `/api/council/run` instead of inserting into Supabase directly.
- `frontend/app/(authenticated)/council/[id]/page.tsx` - Wire real relay path to call new API routes; keep mock mode behind `USE_MOCK_RELAY` flag.

### Reference Files (read-only, on `origin/small_AI_issue`)
- `backend/src/services/llm.ts` - Source for LLM client port.
- `backend/src/services/orchestrator.ts` - Source for orchestrator port.
- `backend/src/services/persistence.ts` - Source for persistence logic (rewrite to Supabase).
- `backend/src/services/modelLineup.ts` - Source for lineup resolution.
- `backend/src/agents/modelA.ts` - Source for agent A.
- `backend/src/agents/modelB.ts` - Source for agent B.
- `backend/src/agents/modelC.ts` - Source for agent C.
- `backend/src/agents/modelD.ts` - Source for agent D.
- `backend/src/types/debate.ts` - Source for server-side types.

### Notes

- All server-only code lives under `frontend/lib/server/` — these files must never be imported from client components.
- Database operations in Route Handlers use the Supabase server client (`@/utils/supabase/server`), not Prisma directly.
- The `OPENROUTER_API_KEY` env var is server-side only — never prefix with `NEXT_PUBLIC_`.
- Mock relay mode (`NEXT_PUBLIC_USE_MOCK_RELAY`) is preserved for development/demo.
- Run `npm run dev --prefix frontend` to test changes locally.
- To read source files from `small_AI_issue`, use: `git show origin/small_AI_issue:<path>` (e.g. `git show origin/small_AI_issue:backend/src/services/llm.ts`).

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 1.0 Environment Setup & Server-Side Types
  - [ ] 1.1 Add `OPENROUTER_API_KEY` and `OPENROUTER_MAX_TOKENS` to `frontend/.env.local` (create the file if it doesn't exist; do NOT commit it — verify it's in `.gitignore`).
  - [ ] 1.2 Create the directory structure `frontend/lib/server/agents/` (all server-only code goes here).
  - [ ] 1.3 Read `backend/src/types/debate.ts` from `origin/small_AI_issue` and port the types (`CyclePhase`, `CycleCount`, `ModelLineup`, `AgentOutput`) into `frontend/lib/server/types.ts`. Also export the `DEFAULT_MODEL_LINEUP` constant with the backend's budget-friendly model IDs.
  - [ ] 1.4 Update `frontend/lib/models.ts` — change the `modelKey` values to match working OpenRouter IDs: `openai/gpt-3.5-turbo`, `anthropic/claude-3.5-haiku`, `meta-llama/llama-3` (keep), `google/gemini-2.5-pro`, `qwen/qwen3-235b-a22b-2507`.

- [ ] 2.0 Port LLM Service & Agent Modules from `small_AI_issue`
  - [ ] 2.1 Read `backend/src/services/llm.ts` from `origin/small_AI_issue`. Port it to `frontend/lib/server/llm.ts`. Clean up excessive `console.log` statements (keep error logging only). Ensure it reads `OPENROUTER_API_KEY` and `OPENROUTER_MAX_TOKENS` from `process.env`.
  - [ ] 2.2 Read `backend/src/agents/modelA.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/agents/modelA.ts`. Update the import of `callLLM` to point to `../llm` and `CyclePhase` to `../types`.
  - [ ] 2.3 Read `backend/src/agents/modelB.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/agents/modelB.ts`. Update imports.
  - [ ] 2.4 Read `backend/src/agents/modelC.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/agents/modelC.ts`. Update imports.
  - [ ] 2.5 Read `backend/src/agents/modelD.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/agents/modelD.ts`. Update imports.
  - [ ] 2.6 Verify all four agent files and `llm.ts` compile without TypeScript errors by running `npx tsc --noEmit` from the `frontend/` directory (or checking linter output).

- [ ] 3.0 Build Orchestrator with Supabase Persistence & 3-Model Support
  - [ ] 3.1 Read `backend/src/services/persistence.ts` from `origin/small_AI_issue`. Create `frontend/lib/server/persistence.ts` that reimplements all persistence functions using the Supabase server client (`createClient` from `@/utils/supabase/server`) instead of Prisma. Functions needed: `createConversation`, `createRound`, `updateCouncilAgentModels`, `saveUserMessage`, `saveMessage`, `saveCycle`, `completeCouncil`.
  - [ ] 3.2 Read `backend/src/services/modelLineup.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/modelLineup.ts`. Adapt `resolveModelLineup` to accept an array of 3–4 model IDs (instead of requiring exactly 4). When 3 models are provided, the returned `ModelLineup` should have `D` set to `null` or `undefined` to signal "skip evaluator".
  - [ ] 3.3 Read `backend/src/services/orchestrator.ts` from `origin/small_AI_issue`. Port to `frontend/lib/server/orchestrator.ts`. Make these adaptations:
    - Replace all persistence calls (`createConversation`, `saveMessage`, etc.) with the Supabase-based versions from task 3.1.
    - Import agents from `./agents/modelA` etc.
    - Import types from `./types`.
  - [ ] 3.4 Add 3-model support to the orchestrator: when `ModelLineup.D` is null/undefined, skip the Model D call in each round. For cycle 1, the `final_summary` becomes Model C's output. For cycle 2, `buildCycle2ModelAInput` receives Model C's output without evaluator feedback (construct a simplified version of the prompt that omits the evaluation section).
  - [ ] 3.5 Add a fallback for Model D's JSON parsing: if `JSON.parse` fails on Model D's response, wrap the raw text in a `{ summary: rawText, issues: [], evaluation: rawText, suggested_improvements: [] }` object instead of throwing.
  - [ ] 3.6 Verify the orchestrator module compiles without TypeScript errors.

- [ ] 4.0 Create Next.js API Route Handlers
  - [ ] 4.1 Create `frontend/app/api/council/run/route.ts` with a `POST` handler that:
    1. Authenticates the user via Supabase server client (`supabase.auth.getUser()`); returns `401` if not authenticated.
    2. Parses and validates the request body (`title`, `prompt`, `cycleCount`, `models` array of 3–4 strings).
    3. Calls `resolveModelLineup` with the models array.
    4. Calls `orchestrateDebate` with the user ID, title, prompt, cycle count, and lineup.
    5. Returns the result as JSON (including `councilId`).
    6. Wraps the entire handler in try/catch and returns `500` with error message on failure.
  - [ ] 4.2 Create `frontend/app/api/council/[councilId]/messages/route.ts` with a `GET` handler that:
    1. Authenticates the user via Supabase server client.
    2. Reads `councilId` from the route params and `after` from the URL search params.
    3. Queries `debate_messages` where `council_id` equals `councilId` and `sequence` is greater than `after`, ordered by `sequence` ascending.
    4. Verifies the council's `owner_id` matches the authenticated user (or relies on RLS).
    5. Also returns the council's current `status` in the response so the frontend knows when to stop polling.
    6. Returns the messages array as JSON.
  - [ ] 4.3 Manually test both routes using `curl` or a REST client to verify they return expected shapes. Confirm `401` when no auth cookie is present.

- [ ] 5.0 Adapt Frontend to Use Real Backend API
  - [ ] 5.1 Update `frontend/lib/api.ts`:
    - Add a new `runCouncil(data: { title: string; prompt: string; cycleCount: number; models: string[] })` function that `POST`s to `/api/council/run` and returns `{ councilId: string }`.
    - Update `triggerCouncilRun(councilId)` — this is no longer needed in the new flow (the run happens during creation). Either remove it or keep it as a no-op with a comment.
    - Update `pollCouncilMessages(councilId, afterSequence)` to call `GET /api/council/{councilId}/messages?after={afterSequence}` and return both the messages array and the council status.
    - Keep `getCouncil`, `listCouncils`, `saveDebateMessage`, `startCouncilRound`, and `completeCouncil` intact — they're still used by the mock relay path and for loading existing councils.
  - [ ] 5.2 Update `frontend/app/(authenticated)/new/page.tsx`:
    - Import `runCouncil` from `@/lib/api` (instead of or in addition to `createCouncil`).
    - In `handleStart()`, call `runCouncil({ title, prompt: question, cycleCount: cycles, models: selectedModels.map(id => modelKeyForId(id)) })` instead of `createCouncil()`.
    - On success, navigate to `/council/{result.councilId}`.
    - The submitted models array should contain the OpenRouter model keys (from `AVAILABLE_MODELS`), not the frontend display IDs.
  - [ ] 5.3 Update `frontend/app/(authenticated)/council/[id]/page.tsx` — real relay path:
    - When `USE_MOCK_RELAY` is `false` and the council status is not `COMPLETED`, start polling with `pollCouncilMessages(id, lastSequence)` at a 3-second interval.
    - On each poll response, append new messages to `logs`, update `currentCycle` and `currentStepIndex` based on the incoming messages.
    - When the response includes `status: "COMPLETED"`, stop polling, set `isFinished = true`, and show the final modal.
    - Remove the call to `triggerCouncilRun(id)` — the run already happened when the council was created from the setup page.
    - If the council loads with status `COMPLETED` (revisiting a finished council), skip polling entirely and just display the persisted transcript (this should already work from existing `buildLogs` logic).
  - [ ] 5.4 Verify mock mode still works: set `NEXT_PUBLIC_USE_MOCK_RELAY=true` in `.env.local` and confirm the existing mock relay flow is unaffected.

- [ ] 6.0 End-to-End Verification & Cleanup
  - [ ] 6.1 Test: Create a council with **4 models** and **1 cycle**. Confirm all 4 agent responses appear in the debate log, final summary modal shows Model D's evaluation summary, and council status is `COMPLETED` in the DB.
  - [ ] 6.2 Test: Create a council with **3 models** and **1 cycle**. Confirm 3 agent responses appear (no Model D), final summary is Model C's output, and no errors are thrown.
  - [ ] 6.3 Test: Create a council with **4 models** and **2 cycles**. Confirm cycle 2 refinement round runs correctly — 8 total messages (4 per cycle), cycle 2 Model A input includes evaluator feedback from cycle 1.
  - [ ] 6.4 Test: Navigate away from a running/completed council and return to `/council/[id]`. Confirm the persisted transcript loads correctly and shows the council as completed.
  - [ ] 6.5 Verify `OPENROUTER_API_KEY` does not appear in any client-side JavaScript bundle. Check the browser's Network tab or run `grep -r "OPENROUTER" frontend/.next/static/` and confirm zero matches.
  - [ ] 6.6 Verify that sidebar council list still loads correctly (existing `listCouncils` should still work since councils are now created by the API route which inserts into the same Supabase tables).
  - [ ] 6.7 Clean up any leftover `console.log` debug statements in the newly created server-side files. Ensure error logs use `console.error` only.
