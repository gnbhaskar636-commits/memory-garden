alter table public.memories
  add column if not exists photo_path text;

create index if not exists memories_photo_path_idx
  on public.memories (photo_path)
  where photo_path is not null;
