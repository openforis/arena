CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

CREATE TABLE
    taxon_vernacular_name
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        taxon_uuid uuid NOT NULL,
        props jsonb DEFAULT '{}'::jsonb,
        props_draft jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

ALTER TABLE taxon ADD CONSTRAINT taxon_uuid_key UNIQUE (uuid);

ALTER TABLE
    taxon_vernacular_name
    ADD CONSTRAINT taxon_vernacular_name_taxon_fk
      FOREIGN KEY (taxon_uuid)
      REFERENCES taxon (uuid)
      ON DELETE CASCADE;
