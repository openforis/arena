ALTER TABLE 
    record
    ALTER COLUMN date_created SET DEFAULT (now() AT TIME ZONE 'UTC');

ALTER TABLE
    node
    ALTER COLUMN date_created SET DEFAULT (now() AT TIME ZONE 'UTC');

ALTER TABLE
    record_update_log
    ALTER COLUMN date_created SET DEFAULT (now() AT TIME ZONE 'UTC');