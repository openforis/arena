CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS job CASCADE;

CREATE TABLE
    job
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        props jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );
