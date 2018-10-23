CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS job CASCADE;

CREATE TABLE
    job
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        user_id bigint NOT NULL,
        survey_id bigint,
        props jsonb DEFAULT '{}'::jsonb,
        status varchar(63) NOT NULL DEFAULT 'created',
        total bigint,
        processed bigint,
        date_started TIMESTAMP without TIME zone DEFAULT now() NOT NULL,
        date_ended TIMESTAMP without TIME zone,
        PRIMARY KEY (id)
    );

ALTER TABLE
    job ADD CONSTRAINT job_survey_fk FOREIGN KEY (survey_id) REFERENCES "survey"(id) ON DELETE CASCADE;

ALTER TABLE
    job ADD CONSTRAINT job_user_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
