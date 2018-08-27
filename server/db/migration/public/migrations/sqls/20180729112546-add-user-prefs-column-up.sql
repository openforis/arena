ALTER TABLE
    "user" ADD COLUMN prefs jsonb DEFAULT '{}'::jsonb;

UPDATE "user" SET prefs = '{}'::jsonb;