import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY. This key bypasses row-level security, so it must never be
// imported into a client component or exposed to the browser.
//
// Falls back to placeholder values so the build never crashes if these
// aren't set yet — real signups/job-posting will return a clear error at
// runtime until you add the real keys in your host's environment variables.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[Kazi] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. ' +
    'Signups and job posting will fail until these are added in your host\'s environment variables and redeployed.'
  );
}

export const supabaseAdmin = createClient(url, key);

// True once real (non-placeholder) config is present — API routes use this
// to return a clean error instead of a confusing Supabase network failure.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
