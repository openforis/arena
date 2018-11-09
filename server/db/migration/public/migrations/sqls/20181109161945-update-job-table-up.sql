ALTER TABLE
    job
    ALTER COLUMN status SET DEFAULT 'pending'
    ADD COLUMN parent_uuid uuid;
