# AGENTS.md

## Cursor Cloud specific instructions

### Overview

MediVault is a Next.js 16 + Supabase emergency medical platform. Single `package.json` at root, no monorepo.

### Services

| Service | How to run | Port |
|---|---|---|
| Next.js dev server | `npm run dev` | 3000 |
| Supabase (local) | `npx supabase start` | 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Mailpit) |

### Quick reference

- **Install deps:** `npm install`
- **Lint:** `npm run lint` (ESLint; note: repo has 3 pre-existing lint errors in `contacts/page.tsx`, `hospitals/page.tsx`, `sos/page.tsx` from React hooks rules — these are not regressions)
- **Build:** `npm run build`
- **Dev server:** `npm run dev`
- **No test framework** is configured (no Jest/Vitest/Playwright)

### Local Supabase setup

Docker must be running before `npx supabase start`. After starting Supabase:

1. Run `npx supabase db reset` to apply all 4 migrations (creates tables, RLS policies, seed data for first-aid guides and site settings).
2. Create `.env.local` from `.env.example` using the local Supabase keys (run `npx supabase status -o env` to get them). The key env vars are:
   - `NEXT_PUBLIC_SUPABASE_URL` → `http://127.0.0.1:54321`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → the `ANON_KEY` from status output
   - `SUPABASE_SERVICE_ROLE_KEY` → the `SERVICE_ROLE_KEY` from status output
   - `NEXT_PUBLIC_APP_URL` → `http://localhost:3000`
3. Local Supabase has email confirmations disabled, so signup works immediately without email verification.

### Gotchas

- `npx supabase start` pulls ~2GB of Docker images on first run; subsequent starts are fast.
- Two Supabase services (`imgproxy`, `pooler`) may show as "Stopped" — this is normal and does not affect functionality.
- The middleware file convention triggers a deprecation warning during build (`middleware → proxy`); this is a Next.js 16 change and does not break anything.
- To bootstrap the first superadmin, sign up via the app then visit `/setup` and click "Claim Superadmin Role".
