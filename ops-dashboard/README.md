# Ops dashboard

Mobile-first ops PWA — tasks, calendar and maintenance spend across MRP, LB and Kove.
Companion app to [maintenance-tracker](https://github.com/ryan-ramsamy/maintenance-tracker), but standalone with its own data.

## Features

- **Tasks** — category filter chips (Maintenance / Housekeeping / Ops / Personal), grouped into Due today / Upcoming / Someday. Unfinished dated tasks roll over to today automatically (Tweek-style).
- **Calendar** — month/week toggle, dots on dates with tasks, tap a date for that day's list.
- **Spend** — monthly maintenance-spend rollup by property (Rand), fed by the cost field on maintenance tasks.
- **Backup** — ⋯ menu → Export data / Import data. Imports merge by task ID (imported wins), so you can move data phone ↔ laptop safely, or restore a JSON snapshot into Supabase.
- **Login** — email/password via Supabase Auth (`src/components/LoginScreen.jsx`), gating everything: `src/App.jsx` doesn't mount `src/Dashboard.jsx` (which owns all the data hooks) until a session exists, so an unauthenticated visitor never issues a single Supabase query. Session persists across app restarts; ⋯ menu → Log out ends it.

Data lives in Supabase (Postgres) — `src/sync.js` talks to it and is the only file that knows about Supabase or localStorage. `src/store.js` holds the pure data shapes/validators (no persistence). Every read goes cache-first through localStorage for instant paint, then reconciles with Supabase on load and on tab focus; every write updates local state + cache immediately (optimistic) and pushes to Supabase in the background. If Supabase is unreachable, the header shows an "Offline" pill and the app keeps working off the last-synced cache — see `src/hooks/useTasks.js` / `useSpend.js`.

## Develop

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

Icons are pre-generated in `public/`; regenerate with `npm run icons` after changing the design in `scripts/gen-icons.mjs`.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase/migrations/0001_init.sql`, run it. Creates the `tasks` and `personal_spend` tables.
3. **Authentication → Users → Add user**: create your one account, with **Auto Confirm User** checked (otherwise sign-in fails with "Email not confirmed" until you click the emailed link — there's no public signup form to resend it from).
4. Open **SQL Editor** again, paste in `supabase/migrations/0002_auth.sql`, run it — **must come after step 3**. It adds a `user_id` column to both tables (backfilling from `auth.users`, safe since there's exactly one user), and replaces the old wide-open anon policies with `auth.uid() = user_id` policies restricted to the `authenticated` role. After this, the anon key alone (no session) can no longer read or write anything — verified: unauthenticated SELECT returns zero rows and INSERT is explicitly rejected with an RLS violation.
5. **Authentication → Settings → Sessions**: set "Time-box user sessions" to however long you want a login to last before forcing re-auth (720 hours ≈ 30 days). This is what actually enforces the timeout — the app persists whatever session Supabase issues, it doesn't invent its own expiry.
6. Copy **Project URL** and the **anon/publishable key** (Settings → API) into `.env` locally (see `.env.example`) and into Netlify's env vars for the deployed build (below). These stay safe to expose client-side — they're meaningless without a valid login now.
7. First load after switching from the old localStorage-only version: if this browser has old data and Supabase is empty, you'll get a one-time prompt to upload it (after logging in).

## Deploy (Netlify)

Push to a Git repo and connect it in Netlify — `netlify.toml` sets the build (`npm run build`, publish `dist`). Then set the Supabase env vars: **Site configuration → Environment variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as your local `.env`, then trigger a redeploy (env var changes don't apply retroactively to already-built output). Then on your phone open the site and "Add to Home Screen".
