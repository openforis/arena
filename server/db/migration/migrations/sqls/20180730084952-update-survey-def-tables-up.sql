CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS survey_version CASCADE;

DROP TABLE
    IF EXISTS survey CASCADE;

DROP TABLE
    IF EXISTS node_def CASCADE;

CREATE TABLE
    survey
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),

        root_node_def_id bigint,

        published boolean NOT NULL DEFAULT false,
        draft boolean NOT NULL DEFAULT true,

        props jsonb,
        props_draft jsonb,

        owner_id bigint NOT NULL,

        PRIMARY KEY (id)
    );

CREATE TABLE
    node_def
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),

        survey_id bigint NOT NULL,
        parent_id bigint NOT NULL,
        type varchar NOT NULL,

        date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
        date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

        deleted boolean NOT NULL DEFAULT false,

        props jsonb,
        props_draft jsonb,

        PRIMARY KEY (id)
    );


    
ALTER TABLE
    survey ADD CONSTRAINT survey_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id");
--ON DELETE CASCADE;

ALTER TABLE
    survey ADD CONSTRAINT survey_root_node_def_fk FOREIGN KEY (root_node_def_id) REFERENCES "node_def" ("id")
ON DELETE CASCADE;

ALTER TABLE
    node_def ADD CONSTRAINT node_def_survey_fk FOREIGN KEY (survey_id) REFERENCES "survey" ("id")
ON DELETE CASCADE;

ALTER TABLE
    node_def ADD CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_id) REFERENCES "node_def" ("id")
ON DELETE CASCADE;


