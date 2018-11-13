ALTER TABLE
    job
    ALTER COLUMN status SET DEFAULT 'pending',
    ADD COLUMN parent_id bigint;

ALTER TABLE
    job ADD CONSTRAINT job_parent_fk FOREIGN KEY (parent_id) REFERENCES "job"(id) ON DELETE CASCADE;

