# The_Council

EagleHacks 2026 Project Submission

## Layout

- **`frontend/`** — Next.js app. Shared UI from the Vite prototype lives in **`frontend/council/`** (ported from **`origin/feature/design-integration`**, folder `Thecouncilv1`). Routes: `/`, `/login`, `/new`, `/council/[id]`. Setup → run uses **`sessionStorage`** (`council-run-payload`). **`frontend/.npmrc`** uses `legacy-peer-deps=true` for React 19 + older peers.
- **`backend/`** — Prisma schema, migrations, and database scripts only today; add an HTTP API here later when you wire UI ↔ data.
- **Repo root** — `README`, `LICENSE`, `.gitignore`, `package.json` (shortcuts), Cursor skills (`.agents/`), etc.

### Env

- **`frontend/.env.local`** — `NEXT_PUBLIC_SUPABASE_*` for the Next.js app.
- **`backend/.env`** — `DATABASE_URL` and `DIRECT_URL` for Prisma (`npm run db:migrate` from root or `backend/`).

### Supabase Auth + `profiles`

1. Run **`backend/supabase/handle_new_user.sql`** in the Supabase SQL Editor once (trigger + RLS on `profiles`).
2. In **Authentication → Providers**, keep **Email** enabled. If **Confirm email** is on, new users see a message until they verify; you can turn confirmation off for hackathon demos.
3. Unauthenticated visits to `/`, `/new`, `/council/…` redirect to **`/login`**. **Log out** clears the Supabase session.

### Commands (from repo root)

| Script        | Runs in      |
|---------------|--------------|
| `npm run dev` | `frontend`   |
| `npm run build` / `start` / `lint` | `frontend` |
| `npm run db:migrate` / `db:ping` / `db:studio` | `backend` |

After clone: `npm install` at the repo root installs both packages via `postinstall`.

If Prisma CLI is missing under `backend` (`node_modules/.bin` empty or `ENOTEMPTY` errors), run `rm -rf backend/node_modules && npm install --prefix backend`, then `npx prisma generate --prefix backend`.
