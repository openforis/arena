ALTER TABLE node_def
  ADD COLUMN props_advanced jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN props_advanced_draft jsonb DEFAULT '{}'::jsonb;