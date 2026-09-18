-- PassOnce Phase 2-9 wiring
-- Run this file once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists profile_theme text not null default 'aurora',
  add column if not exists profile_effect text not null default 'sparkles',
  add column if not exists avatar_frame text not null default 'rainbow';

create table if not exists public.saved_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  exam_id text not null,
  subject text not null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, question_key)
);

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,
  subject text not null,
  question text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'system',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists saved_questions_user_created_idx on public.saved_questions(user_id, created_at desc);
create index if not exists question_reports_user_created_idx on public.question_reports(user_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.saved_questions enable row level security;
alter table public.question_reports enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "saved_questions_own_select" on public.saved_questions;
drop policy if exists "saved_questions_own_insert" on public.saved_questions;
drop policy if exists "saved_questions_own_delete" on public.saved_questions;
create policy "saved_questions_own_select" on public.saved_questions for select using (auth.uid() = user_id);
create policy "saved_questions_own_insert" on public.saved_questions for insert with check (auth.uid() = user_id);
create policy "saved_questions_own_delete" on public.saved_questions for delete using (auth.uid() = user_id);

drop policy if exists "question_reports_own_insert" on public.question_reports;
create policy "question_reports_own_insert" on public.question_reports for insert with check (auth.uid() = user_id);
drop policy if exists "question_reports_own_select" on public.question_reports;
create policy "question_reports_own_select" on public.question_reports for select using (auth.uid() = user_id);

drop policy if exists "notifications_own_select" on public.notifications;
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_own_insert" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications_own_update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
drop policy if exists "avatar_own_insert" on storage.objects;
drop policy if exists "avatar_own_update" on storage.objects;
drop policy if exists "avatar_own_delete" on storage.objects;
create policy "avatar_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatar_own_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar_own_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatar_own_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime is used only for ephemeral direct messages; messages are not persisted.
-- Enable the Realtime publication for profiles so username lookup changes can propagate if desired.
alter table public.profiles replica identity full;
