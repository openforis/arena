CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS node_def CASCADE;

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
        root_def_id bigint,
        PRIMARY KEY (id)
    );


CREATE TABLE
    node_def
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        survey_version_id bigint NOT NULL,
        parent_id bigint,
        type VARCHAR NOT NULL,
        props jsonb,
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

ALTER TABLE
    node_def ADD CONSTRAINT node_def_survey_version_fk FOREIGN KEY (survey_version_id) REFERENCES "survey_version" ("id")
ON DELETE CASCADE;

ALTER TABLE
    node_def ADD CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_id) REFERENCES "node_def" ("id")
ON DELETE CASCADE;