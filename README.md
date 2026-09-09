# Memory Garden

A journaling app: plant small memories, watch them grow into a garden, and
get a monthly reflection on the moods and moments you've kept.

Built with React 19, TanStack Start/Router/Query, Tailwind v4, Radix UI, and
Supabase (Auth + Postgres). Originally scaffolded in xAI's Grok App Builder
sandbox; this copy has had all of the Grok-platform-specific plumbing (the
OAuth broker, the live-preview iframe bridge, the sandbox deploy scripts)
removed and replaced with a standalone equivalent so it can run and deploy
on its own.

## Requirements

- Node 22+
- A Supabase project ([supabase.com](https://supabase.com), free tier is
  fine) — or the [Supabase CLI](https://supabase.com/docs/guides/cli) for a
  fully local Postgres via `supabase start` (Docker required)

## Local development

1. Create a Supabase project (or run `supabase start` locally) and grab, from
   **Project Settings → API** and **Project Settings → Database**:
   - the project URL
   - the anon (public) key
   - the service role key (keep this one secret)
   - the direct Postgres connection string
2. Create a `.env` file in the project root:

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   DATABASE_URL=postgresql://postgres:...@...supabase.co:5432/postgres
   ```
3. Apply the schema against your database:

   ```bash
   npm install
   npm run db:migrate
   ```
4. Enable Email sign-in for your project under **Authentication → Providers**
   (on by default for new projects). To add Google sign-in, enable the
   Google provider there and follow Supabase's prompts for an OAuth client —
   no manual client-id wiring in this codebase is needed.
5. Start the app:

   ```bash
   npm run dev
   ```

The app comes up at `http://localhost:8080`. Unlike the previous Better
Auth + PGLite setup, there is no zero-config local fallback anymore — the
steps above (a real or locally-run Supabase Postgres) are required even for
local dev, since the app's data and identity both live there now.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Your Supabase project URL. Safe to expose to the browser. |
| `SUPABASE_ANON_KEY` | Yes | Supabase's public anon key. Safe to expose to the browser — protected by Row Level Security, not secrecy. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Bypasses Row Level Security. Server-only — never expose to the client. Not required by any current code path; kept for future admin/background jobs. |
| `DATABASE_URL` | Yes | Direct Postgres connection string (Project Settings → Database), used by `src/lib/db.ts` and `scripts/migrate.mjs`. |
| `OPENROUTER_API_KEY` | Optional | Enables real AI memory analysis via OpenRouter (`src/lib/ai/analyze.server.ts`). Without it, analysis falls back to a rule-based analyzer — the feature (and any demo) still works. |
| `OPENROUTER_MODEL` | Optional | OpenRouter model id (default: `openai/gpt-4o-mini`). |

## Database

Schema lives in `migrations/*.sql`, applied via `npm run db:migrate` (also
run automatically as part of `npm run build`) against whatever
`DATABASE_URL` points at. There's no local-fallback auto-apply anymore —
run the command yourself after `supabase start` or against a fresh hosted
project.

Add new tables/columns as new ordered files (`0003_*.sql`, `0004_*.sql`, ...)
— never edit an already-applied migration.

- `migrations/0002_memories.sql` — the app's `memories` and
  `garden_settings` tables, both with a `user_id uuid` foreign key into
  Supabase's own `auth.users` table (which Supabase manages — you never
  migrate it yourself), plus Row Level Security policies scoped to
  `auth.uid()`.
- `migrations/0003_memory_analysis.sql` — adds `tags`, `emotion_intensity`,
  `primary_emotion`, `secondary_emotion`, `sentiment`, and `ai_analyzed` to
  `memories`, all nullable/defaulted so existing rows are unaffected.

The app's server functions (`src/lib/memories/server.ts`) query these tables
over the direct `DATABASE_URL` connection, scoping every query by the
authenticated user's id in application code — RLS is enabled as
defense-in-depth on top of that, and is what you'd rely on exclusively if you
later switch reads/writes to the Supabase JS client instead of raw SQL.

## Deploying

The Vite config's `nitro()` preset defaults to `"vercel"`. Change it in
`vite.config.ts` to target a different host (Node server, Cloudflare Pages,
etc. — see https://nitro.build/deploy). Wherever you deploy, set the
environment variables above, pointing at your Supabase project.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 8080 |
| `npm run build` | Production build + apply pending migrations |
| `npm run db:migrate` | Apply pending migrations against `DATABASE_URL` |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |

## AI memory analysis

`src/lib/ai/analyze.server.ts` looks at a memory's title, description, and
mood and returns a primary/secondary emotion, sentiment, a 1–10 intensity,
and up to 5 tags. It's called from the "Analyze" button in the plant/edit
dialog, via the `analyzeMemoryDraft` server function
(`src/lib/memories/server.ts`) — gated by `authMiddleware` so it can't be
hit anonymously.

- **With `OPENROUTER_API_KEY` set**: uses OpenRouter (default model
  `openai/gpt-4o-mini`, overridable via `OPENROUTER_MODEL`) for real analysis.
- **Without it**: falls back to a keyword/heuristic rule-based analyzer —
  same shape of result, no network call, no key required. A live demo works
  either way.
- **Swapping providers**: implement the `AnalysisProvider` interface in that
  file and change what `getProvider()` returns. Nothing outside
  `analyze.server.ts` needs to change.

## What's not done yet

This is a working standalone app, not a finished product. Before real users:

- **Photo storage**: memory photos are stored as-is in the `photo` column
  (currently data URLs from the browser). Wire up real object storage
  (Supabase Storage, S3, Cloudflare R2) and store a URL/key instead — the
  schema already anticipates this (see the comment in
  `migrations/0002_memories.sql`).
- **Sign-in UI**: the auth plumbing (`src/lib/auth/*`) is fully wired to
  Supabase, but there's no `/login` route/form yet — build one with
  `signUpEmail` / `signInEmail` / `signInGoogle` from `@/lib/auth/client`
  and gate routes with `SignedIn` / `RedirectToSignIn` from
  `@/lib/auth/gates`.
- **Error monitoring**: nothing is wired up (Sentry or similar recommended).
- **Rate limiting**: server functions have no rate limits yet.
- **CI**: no pipeline configured — run `typecheck`, `lint`, and `test` on
  every push before deploying.
