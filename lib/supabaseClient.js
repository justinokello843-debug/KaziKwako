import { createClient } from '@supabase/supabase-js';

// Falls back to harmless placeholder values if real env vars aren't set yet
// (e.g. during a build before you've added them on Netlify/Vercel). This
// stops the whole build from crashing; real reads/writes will just fail
// gracefully at runtime with a clear "not configured" error instead.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '[Kazi] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
    'The site will build, but job listings and signups will not work until these are added ' +
    'in your host\'s environment variables and redeployed.'
  );
}

// Safe to use in the browser: the anon key can only do what your
// row-level-security policies allow (public read of jobs, nothing else).
export const supabase = createClient(url, key);
