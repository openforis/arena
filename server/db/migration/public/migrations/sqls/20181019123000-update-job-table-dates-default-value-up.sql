ALTER TABLE
    job
    ALTER COLUMN date_started SET DEFAULT (now() AT TIME ZONE 'UTC');