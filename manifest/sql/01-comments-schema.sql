-- OMNI Dashboard: comments table for anonymous boss feedback
-- Run this once in your Supabase SQL editor.

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,
  author      text,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index if not exists idx_comments_project_time
  on public.comments (project_id, created_at desc);

-- Row Level Security: anyone with the anon key can read + insert,
-- but no one can update or delete via the public API.
alter table public.comments enable row level security;

drop policy if exists "anon read comments"   on public.comments;
drop policy if exists "anon insert comments" on public.comments;

create policy "anon read comments"
  on public.comments for select
  to anon
  using (true);

create policy "anon insert comments"
  on public.comments for insert
  to anon
  with check (
    char_length(body) between 1 and 4000
    and (author is null or char_length(author) <= 80)
  );

-- ─────────────────────────────────────────────────────────────────
-- Daily notes: one row per day, anyone with the URL can read/upsert.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  date        date primary key,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "anon read notes"   on public.notes;
drop policy if exists "anon insert notes" on public.notes;
drop policy if exists "anon update notes" on public.notes;

create policy "anon read notes"   on public.notes for select to anon using (true);
create policy "anon insert notes" on public.notes for insert to anon with check (char_length(body) <= 50000);
create policy "anon update notes" on public.notes for update to anon using (true) with check (char_length(body) <= 50000);
