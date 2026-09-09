-- AI memory analysis fields.
--
-- Additive only — appended to the existing `memories` table rather than
-- editing 0002 in place, since (unlike last time) this app may already be
-- deployed with real data by now. All columns are nullable / default to an
-- empty state so every row written before this migration keeps working
-- unchanged; nothing here is backfilled.
--
-- `tags` and the four AI fields are filled in by `src/lib/ai/analyze.server.ts`
-- (either a real AI provider or its rule-based fallback — see that file) when
-- the user asks to analyze a memory. `ai_analyzed` distinguishes "never
-- asked" (false, all AI fields null) from "analysis ran" so the UI can tell
-- the difference between "not analyzed yet" and "analyzed as neutral".

alter table memories
  add column if not exists tags text[] not null default '{}',
  add column if not exists emotion_intensity smallint,
  add column if not exists primary_emotion text,
  add column if not exists secondary_emotion text,
  add column if not exists sentiment text,
  add column if not exists ai_analyzed boolean not null default false;

alter table memories
  add constraint memories_emotion_intensity_range
    check (emotion_intensity is null or emotion_intensity between 1 and 10);

alter table memories
  add constraint memories_sentiment_values
    check (sentiment is null or sentiment in ('positive', 'neutral', 'negative'));

-- Tag search/filter (the upcoming emotional timeline filters by tag).
create index if not exists memories_tags_idx on memories using gin (tags);
