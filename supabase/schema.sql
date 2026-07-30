-- Kazi database schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run

-- 1. Job seekers who sign up for alerts
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  role_interest text not null,       -- e.g. "Product Designer", "Backend Engineer"
  location text,                      -- e.g. "Nairobi", "Remote"
  experience_level text,              -- e.g. "Entry", "Mid", "Senior"
  cv_url text,                        -- link to uploaded CV in storage
  subscribed boolean default true,    -- false if they unsubscribe later
  shortlisted boolean default false,
  shortlisted_at timestamptz,
  rejected boolean default false,
  rejected_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Jobs you post
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  role_category text not null,        -- matched against subscribers.role_interest
  job_type text,                      -- Full-time / Part-time / Contract / Remote
  salary_range text,
  description text not null,
  apply_url text,                     -- optional external apply link, if you want one
  created_at timestamptz default now()
);

-- 3. Log of who got notified about which job (avoids double-emailing, gives you a record)
create table if not exists notifications_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  subscriber_id uuid references subscribers(id) on delete cascade,
  sent_at timestamptz default now()
);

-- 4. A running record of every automated message the platform sends —
--    welcome emails, job-match alerts, broadcasts, shortlist notices, and
--    application confirmations — a clear audit trail of what went out, to whom, and when.
create table if not exists message_log (
  id uuid primary key default gen_random_uuid(),
  message_type text not null,        -- 'welcome' | 'job_alert' | 'broadcast' | 'shortlist' | 'rejection' | 'application'
  recipient_email text not null,
  subject text,
  related_job_id uuid references jobs(id) on delete set null,
  status text not null default 'sent', -- 'sent' | 'failed'
  sent_at timestamptz default now()
);

-- 5. Real applications submitted against a specific job — this is the
--    screen-then-forward pipeline: candidate applies here directly, you
--    review their CV and details, then forward the ones you select to the employer.
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  cover_note text,
  cv_url text,
  status text not null default 'new',  -- 'new' | 'reviewed' | 'shortlisted' | 'forwarded' | 'rejected'
  created_at timestamptz default now()
);

create index if not exists idx_applications_job on applications (job_id);
create index if not exists idx_applications_status on applications (status);
create index if not exists idx_message_log_type on message_log (message_type);
create index if not exists idx_message_log_sent_at on message_log (sent_at desc);
create index if not exists idx_subscribers_role on subscribers (role_interest);
create index if not exists idx_subscribers_location on subscribers (location);

-- Enable Row Level Security (recommended). We insert/read via the server using
-- the service role key, which bypasses these policies, so the site keeps working;
-- this just blocks randoms from reading the tables directly via the public API.
alter table subscribers enable row level security;
alter table jobs enable row level security;
alter table notifications_log enable row level security;
alter table message_log enable row level security;
alter table applications enable row level security;

-- Anyone can read job listings (so the homepage can show them)
create policy "Public can read jobs" on jobs
  for select using (true);
