-- Optional reflections written when revisiting an old memory via Time Machine.
-- Additive only. RLS scoped to the owning user.

create table if not exists memory_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  memory_id text not null references memories (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists memory_reflections_user_idx
  on memory_reflections (user_id, created_at desc);

create index if not exists memory_reflections_memory_idx
  on memory_reflections (memory_id, created_at desc);

alter table memory_reflections enable row level security;

create policy "memory_reflections_select_own" on memory_reflections
  for select using (auth.uid() = user_id);

create policy "memory_reflections_insert_own" on memory_reflections
  for insert with check (auth.uid() = user_id);

create policy "memory_reflections_delete_own" on memory_reflections
  for delete using (auth.uid() = user_id);
