# Prompt Odyssey

**EagleHacks 2026**

## Project summary

| | |
| --- | --- |
| **Project name** | **Prompt Odyssey** |
| **Elevator pitch** | Introducing **Prompt Odyssey**, an orchestrated multi-model pipeline that receives a user’s prompt, refines an answer across multiple LLMs, and then delivers the best response to the user. It blends the strengths of different models while covering for their weaknesses to produce a strong, synthesized answer. |
| **Technologies** | Next.js · React · TypeScript · Tailwind CSS · Supabase (Auth & Postgres) · Fastify · Prisma · OpenRouter (LLMs) |

---

## Inspiration

The core inspiration for this project comes from the YouTube creator PewDiePie: in one video, a group of high-end GPUs each hosts an AI model, and he sends one prompt to the whole system so each model tries to produce the best response. We loved that premise and wanted a more cost-effective, user-friendly way to prompt multiple models. We also wanted to go further by having different models **refine** the response as it moves through the pipeline—using a “two heads are better than one” philosophy with LLMs to get the best possible answer for the user.

## What it does

Our LLM council lets the user send **one prompt** to **multiple AI models**. The prompt is evaluated and refined as it moves through the pipeline, aiming for a clear, concise, still detailed answer. The intent is for models to give initial takes, others to critique, and the flow to converge on a synthesis of competing ideas.

**Flow:** the user chooses the **order** of models and each model’s **role** (slot). Models run in sequence with the user’s prompt in context. During the run, the UI shows live progress and each model’s contributions in a side log. After every model has participated, the final response is presented to the user.

## How we built it

The **frontend** was designed in Figma and built with **React** and **Next.js**. The **backend** uses **PostgreSQL** through **Supabase** (auth and data) with **Prisma** for schema and migrations in the API service. The **AI orchestration** service is **TypeScript** on **Fastify**, calling models primarily through **OpenRouter**. The Next.js app talks to Supabase from the browser and to the orchestration API for council runs.

## Challenges we ran into

**Integration** was the hardest part: frontend and backend pieces worked in isolation (e.g. Postman), but wiring a full-stack flow surfaced many issues—schema alignment, auth, and linking services end-to-end.

**Token budget** was the second major constraint: limited testing with full LLM calls, so we had to be careful about how often we hit models during development.

## Accomplishments we’re proud of

Shipping something close to what we envisioned—a tool with a fun backstory, real utility, and room to grow. We built something we wish we’d had access to before building it ourselves.

## What we learned

We leveled up on **languages and frameworks**, **system design** across frontend and backend, and **teamwork**: clear expectations, surfacing blockers, pivoting when needed, and strong communication—especially during integration.

## What’s next for Prompt Odyssey

There is a lot of room to grow. The most obvious lever is a **larger budget** for better models, more models, and more thorough testing. We hope to revisit the project with more resources to push quality and scale further.

---

## How to run (local development)

### Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- A **Supabase** project (URL + anon/publishable key)
- For real LLM runs: **OpenRouter** API key on the backend, and the **Fastify API** running

### 1. Install

From the **repository root**:

```bash
npm install
```

This installs root scripts and runs `postinstall` for `backend/` and `frontend/`.

### 2. Environment variables

**`frontend/.env.local`** (create from this template):

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-anon-or-publishable-key>

# Orchestrator (default if omitted: http://localhost:3001)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Set to true to simulate the council without the API (dev/demo)
NEXT_PUBLIC_USE_MOCK_RELAY=false
```

**`backend/.env`** — configure at least:

- Database URLs for **Prisma** (`DATABASE_URL`, `DIRECT_URL` as needed for migrations)
- **JWT / Supabase** verification settings expected by the API (see `backend/src` and server config)
- **OpenRouter** (or equivalent) keys used by the orchestrator

Never commit real secrets; keep `.env` and `.env.local` out of git.

### 3. Database

From the **repo root** (or `backend/`):

```bash
npm run db:migrate
```

Use `npm run db:studio` to inspect data if needed.

### 4. Start the app

You need **two processes** for a full run (UI + orchestrator):

**Terminal A — Next.js frontend** (from repo root):

```bash
npm run dev
```

Opens the app (default [http://localhost:3000](http://localhost:3000)).

**Terminal B — Fastify API / orchestrator** (from repo root):

```bash
npm run api:dev
```

Default API base: `http://localhost:3001` (must match `NEXT_PUBLIC_API_URL` unless you override).

### 5. Optional: mock relay only

Set `NEXT_PUBLIC_USE_MOCK_RELAY=true` in `frontend/.env.local` to exercise the UI without the orchestrator (no OpenRouter calls for the relay).

### Useful scripts (repo root)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (`frontend`) |
| `npm run api:dev` | Fastify API (`backend`) |
| `npm run build` | Production build of the frontend |
| `npm run start` | Start production Next server (after `build`) |
| `npm run lint` | ESLint (`frontend`) |
| `npm run db:migrate` | Prisma migrations (`backend`) |
| `npm run db:studio` | Prisma Studio (`backend`) |
| `npm run db:ping` | Quick DB connectivity check (`backend`) |

If Prisma CLI misbehaves under `backend`, try reinstalling backend deps: `rm -rf backend/node_modules && npm install --prefix backend`, then `npx prisma generate` inside `backend/`.

---

## Repository layout

- **`frontend/`** — Next.js app (App Router, Supabase auth helpers, council UI).
- **`backend/`** — Fastify API, Prisma schema/migrations, orchestration and LLM calls.
- **Root** — Aggregated npm scripts, this README, shared tooling.

---

## License

See `LICENSE` if present in the repository.
