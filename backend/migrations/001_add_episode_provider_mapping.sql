-- Step 1: add provider mapping to episodes.
-- Existing rows remain valid with NULL provider fields.

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_episode_id text;

-- Prevent the same provider episode from being mapped
-- to multiple database episodes.
ALTER TABLE public.episodes
  ADD CONSTRAINT episodes_provider_episode_unique
  UNIQUE (provider, provider_episode_id);
