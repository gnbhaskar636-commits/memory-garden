-- Memories + garden settings, scoped per authenticated Supabase user.
--
-- `user_id` is UUID, referencing Supabase Auth's own `auth.users(id)` table
-- (Supabase manages that schema; you never migrate it yourself). Deleting a
-- user cascades to their memories and settings.
--
-- Row Level Security is enabled as defense-in-depth: this app's server
-- functions already scope every query by `user_id` over a direct Postgres
-- connection (see src/lib/memories/server.ts) using `DATABASE_URL`, which
-- bypasses RLS — but these policies mean the same tables are also safe to
-- query straight from the Supabase JS client with the public anon key,
-- should you switch to that path later (see the migration brief).
--
-- `photo` stores whatever the upload pipeline hands back — a data URL while
-- there's no object storage wired up, or a signed URL/key once you add one
-- (Supabase Storage, S3, Cloudflare R2, ...). Swap the app-side upload code,
-- not this column.

create table if not exists memories (
  id text not null primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  date date not null,
  mood text not null,
  location text not null default '',
  photo text,
  favorite boolean not null default false,
  marker_kind text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_user_id_idx on memories (user_id);
create index if not exists memories_user_id_date_idx on memories (user_id, date desc);

alter table memories enable row level security;

create policy "memories_select_own" on memories
  for select using (auth.uid() = user_id);

create policy "memories_insert_own" on memories
  for insert with check (auth.uid() = user_id);

create policy "memories_update_own" on memories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "memories_delete_own" on memories
  for delete using (auth.uid() = user_id);

create table if not exists garden_settings (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  theme text not null default 'light',
  reduced_motion boolean not null default false,
  display_name text not null default '',
  hide_locations boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table garden_settings enable row level security;

create policy "garden_settings_select_own" on garden_settings
  for select using (auth.uid() = user_id);

create policy "garden_settings_insert_own" on garden_settings
  for insert with check (auth.uid() = user_id);

create policy "garden_settings_update_own" on garden_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "garden_settings_delete_own" on garden_settings
  for delete using (auth.uid() = user_id);
