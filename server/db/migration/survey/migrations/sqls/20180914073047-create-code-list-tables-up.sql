CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS code_list_level CASCADE;

DROP TABLE
    IF EXISTS code_list_item CASCADE;

DROP TABLE
    IF EXISTS code_list CASCADE;

CREATE TABLE
    code_list
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

CREATE TABLE
    code_list_level
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        code_list_id bigint NOT NULL,
        index integer NOT NULL,
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

CREATE TABLE
    code_list_item
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        level_id bigint NOT NULL,
        parent_id bigint,
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

ALTER TABLE
    code_list_level ADD CONSTRAINT code_list_level_list_fk FOREIGN KEY (code_list_id) REFERENCES code_list (id) ON DELETE CASCADE;

ALTER TABLE
    code_list_item ADD CONSTRAINT code_list_item_level_fk FOREIGN KEY (level_id) REFERENCES code_list_level (id) ON DELETE CASCADE;

ALTER TABLE
    code_list_item ADD CONSTRAINT code_list_item_parent_fk FOREIGN KEY (parent_id) REFERENCES code_list_item (id) ON DELETE CASCADE;
