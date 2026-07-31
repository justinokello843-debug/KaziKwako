# Kazi — data collection + job alerts, set up guide

This is a working app: people sign up with their email, phone, role, and CV.
It's stored in a real database. When you post a job, everyone whose role
matches gets emailed automatically. Follow these steps in order — none of
them require writing code, just clicking through free signups.

Total time: ~30–40 minutes the first time.

---

## 1. Create your database (Supabase) — ~10 min

1. Go to https://supabase.com → sign up free → **New project**.
2. Once it's created, go to **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this project, copy all of it, paste it in, and click **Run**.
   This creates three tables: `subscribers`, `jobs`, `notifications_log`.
4. Go to **Storage** (left sidebar) → **Create a new bucket** → name it exactly `cvs` → keep it **private** (not public) → create.
   This is where uploaded CVs get stored securely.
5. Go to **Project Settings → API**. You'll need three values from this page in step 3 below:
   - `Project URL`
   - `anon public` key
   - `service_role` key (click "reveal" — keep this one secret, never share it)

## 2. Create your email sender (Resend) — ~10 min

1. Go to https://resend.com → sign up free (100 emails/day free, enough to start).
2. Go to **API Keys** → **Create API Key** → copy it.
3. Go to **Domains** → add your domain (e.g. `yourcompany.com`) and add the DNS records they show you
   (done through wherever you bought your domain — GoDaddy, Namecheap, etc.).
   Until that's verified, you can still test using Resend's own sandbox sender address shown in their dashboard.

## 3. Fill in your environment variables — ~5 min

1. In this project, copy `.env.example` to a new file called `.env.local`.
2. Fill in the values you collected above:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` → from Supabase
   - `RESEND_API_KEY` and `ALERTS_FROM_EMAIL` → from Resend
   - `ADMIN_PASSCODE` → make up a password only you know (this gates the `/admin` dashboard)
   - `ADMIN_NOTIFICATION_EMAIL` → your real, personal email — this is where "someone started a chat" alerts land

## 4. Run it locally to test — ~5 min

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the homepage with the signup form.
Try signing up, then go to http://localhost:3000/admin, enter your passcode, and post a test job.
If you filled in a role that matches your test signup, you should get an email within seconds.

## 5. Put it online

You can use either Netlify or Vercel — pick one.

### Option A: Netlify

1. Push this folder to a GitHub repository (create one at github.com, then
   `git init && git add . && git commit -m "kazi" && git remote add origin <your-repo-url> && git push`).
2. Go to https://app.netlify.com → **Add new site → Import an existing project** → pick this repo.
   Netlify will detect it's a Next.js app automatically (this project includes `netlify.toml` for that).
3. **Before the first deploy finishes**, go to **Site configuration → Environment variables** and add
   all six values from your `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, `ALERTS_FROM_EMAIL`, `ADMIN_PASSCODE`.
   These must be set **before** a build runs — Next.js bakes `NEXT_PUBLIC_...` values into the build itself.
4. Go to **Deploys → Trigger deploy → Deploy site** to rebuild now that the variables are set.
5. (Optional) Under **Domain management**, connect a custom domain you own.

### Option B: Vercel

1. Push this folder to a GitHub repository, same as above.
2. Go to https://vercel.com → sign up free with GitHub → **Add New Project** → pick this repo.
3. Before deploying, click **Environment Variables** and paste in the same six values.
4. Click **Deploy**. In about a minute you'll get a live URL like `kazi.vercel.app`.
5. (Optional) Under **Domains**, connect a custom domain you own.

Either way: if you ever see a build fail because of missing Supabase values, it means
the environment variables weren't saved before the build ran — add them, then trigger
a fresh deploy. (This project also no longer hard-crashes the build if they're missing —
see "Built-in safety net" below — but the site won't actually work until they're set.)

Your site is now live and actually collecting data.

## Built-in safety net

The Supabase connection code (`lib/supabaseClient.js` and `lib/supabaseAdmin.js`) is
written so a missing environment variable never crashes the whole build — it just logs
a warning and the affected feature (signups, job posting, live job listings) returns a
clear "not configured yet" message until you add the real keys. This means a bad or
missing key shows up as an obvious in-app message, not a broken deploy.

---

## New: currency, language, and WhatsApp

- **Currency auto-detection.** On page load, the site quietly asks a free IP-lookup
  service (`ipwho.is`) what country the visitor is in, converts pricing from USD using
  live exchange rates (`open.er-api.com`), and shows a currency dropdown next to
  pricing in case someone's on a VPN and the guess is wrong. Their choice is remembered
  for next time. No API keys needed for either service.
- **Language switcher.** English, Kiswahili, Français, and العربية (Arabic, right-to-left
  layout included) — a dropdown in the nav switches instantly and remembers the choice.
  Translation strings live in `lib/i18n.js`; the highest-traffic text (navigation, hero,
  stats, live jobs, pricing, footer, the WhatsApp button) is translated. Deeper marketing
  copy (the "how it works" and feature sections) is still English-only — add more keys to
  `lib/i18n.js` the same way to extend it.
- **WhatsApp button.** A floating button on every page opens a chat to **+254 780 228 067**
  with a pre-filled message. The number is set once in `app/components/WhatsAppButton.js`
  (and reused on the Enterprise pricing card) — change it there if the number changes.

## How it works, in plain terms

- **Someone signs up** on the homepage → their info + CV go straight into your Supabase database.
- **You post a job** at `/admin` → it's saved to the `jobs` table, and the app looks through
  every subscriber whose "role interest" roughly matches, then emails each of them via Resend.
- **The homepage** always shows the latest jobs pulled live from the database — no manual updating.

## What's intentionally left as an MVP (worth upgrading before you scale)

- **`/admin` uses a single shared passcode**, not real accounts. Fine for you alone posting jobs;
  before letting other employers post their own jobs, swap this for real authentication
  (Supabase Auth handles this well and is a small addition, not a rewrite).
- **Role matching is a simple text match**, not the fuzzy "product designer ≈ UX lead" matching
  described in your original brief — a good next step once you have real usage data to tune it on.
- **Emails send one at a time in a loop.** Fine for tens or low hundreds of subscribers per job.
  Once you're past that, move to Resend's batch-send endpoint or a queue (e.g. Supabase Edge Functions + a queue).
- **No resume parsing yet** — CVs are stored as files, not auto-read into structured fields.
  When you're ready, Affinda or RChilli plug in as a processing step after upload.
- **No employer self-serve signup or payments yet** — right now only you can post jobs.
  Stripe (billing) and Supabase Auth (employer accounts) are the two additions for that.

## Project structure

```
app/
  page.js              → homepage: hero + signup form + live job list
  components/
    SignupForm.js      → the signup form itself (client-side)
  api/
    signup/route.js    → saves a subscriber + uploads their CV
    post-job/route.js  → saves a job + emails matching subscribers
  admin/page.js         → passcode-gated job-posting form
lib/
  supabaseClient.js     → safe for the browser (read-only, public data)
  supabaseAdmin.js      → server-only, full access — never imported into a client component
supabase/
  schema.sql            → run this once in Supabase's SQL editor
```
