-- Persist each memory's world location so its tree stays in the same place.
alter table memories
  add column if not exists world_x double precision,
  add column if not exists world_z double precision;

create index if not exists memories_world_position_idx
  on memories (user_id, world_x, world_z);