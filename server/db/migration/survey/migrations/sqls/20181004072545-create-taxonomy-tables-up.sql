CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS taxon CASCADE;

DROP TABLE
    IF EXISTS taxonomy CASCADE;

CREATE TABLE
    taxonomy
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

CREATE TABLE
    taxon
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        taxonomy_id bigint NOT NULL,
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

ALTER TABLE
    taxon ADD CONSTRAINT taxon_taxonomy_fk FOREIGN KEY (taxonomy_id) REFERENCES taxonomy (id) ON DELETE CASCADE;
