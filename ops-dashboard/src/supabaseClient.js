import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fails loudly at startup rather than every individual query silently
  // no-op-ing — a missing .env (or missing Netlify env vars on deploy)
  // is a setup mistake, not a runtime condition to handle gracefully.
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env (or set the equivalent Netlify env vars) and fill them in.'
  );
}

// Single-user app with email/password Supabase Auth (account created
// manually in the dashboard — see supabase/migrations/0002_auth.sql).
// Session persists in localStorage across app restarts so the PWA
// doesn't demand a login every time; auto-refresh keeps it alive while
// used, and the project's session-timeout setting (Dashboard ->
// Authentication -> Settings -> Sessions) is what actually forces
// re-login after ~30 days, not anything client-side.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
