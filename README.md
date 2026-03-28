# The_Council

EagleHacks 2026 Project Submission

## Layout

- **`frontend/`** — Next.js app (pages, layouts, styles, Supabase browser + middleware helpers). Your UI team works here. Run `npm run dev` from the repo root or from `frontend/`.
- **`backend/`** — Prisma schema, migrations, and database scripts only today; add an HTTP API here later when you wire UI ↔ data.
- **Repo root** — `README`, `LICENSE`, `.gitignore`, `package.json` (shortcuts), Cursor skills (`.agents/`), etc.

### Env

- **`frontend/.env.local`** — `NEXT_PUBLIC_SUPABASE_*` for the Next.js app.
- **`backend/.env`** — `DATABASE_URL` and `DIRECT_URL` for Prisma (`npm run db:migrate` from root or `backend/`).

### Commands (from repo root)

| Script        | Runs in      |
|---------------|--------------|
| `npm run dev` | `frontend`   |
| `npm run build` / `start` / `lint` | `frontend` |
| `npm run db:migrate` / `db:ping` / `db:studio` | `backend` |

After clone: `npm install` at the repo root installs both packages via `postinstall`.

If Prisma CLI is missing under `backend` (`node_modules/.bin` empty or `ENOTEMPTY` errors), run `rm -rf backend/node_modules && npm install --prefix backend`, then `npx prisma generate --prefix backend`.
