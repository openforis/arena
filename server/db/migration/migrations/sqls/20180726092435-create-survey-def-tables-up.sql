CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS survey_version CASCADE;

DROP TABLE
    IF EXISTS survey CASCADE;

CREATE TABLE
    survey
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        owner_id bigint NOT NULL,
        published_version_id bigint,
        draft_version_id bigint,
        props jsonb,
        PRIMARY KEY (id)
    );

CREATE TABLE
    survey_version
    (
        id bigserial NOT NULL,
        survey_id bigint NOT NULL,
        node_defs jsonb,
        date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
        date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
        PRIMARY KEY (id)
    );


    
ALTER TABLE
    survey ADD CONSTRAINT survey_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id");
--ON DELETE CASCADE;

ALTER TABLE
    survey ADD CONSTRAINT survey_published_version_fk FOREIGN KEY (published_version_id) REFERENCES "survey_version" ("id");

ALTER TABLE
    survey ADD CONSTRAINT survey_draft_version_fk FOREIGN KEY (draft_version_id) REFERENCES "survey_version" ("id");

ALTER TABLE
    survey_version ADD CONSTRAINT survey_version_survey_fk FOREIGN KEY (survey_id) REFERENCES "survey" ("id")
ON DELETE CASCADE;

