CREATE TABLE
  taxonomy
(
  id          bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  props       jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft jsonb     NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT taxonomy_uuid_key UNIQUE (uuid)
);

CREATE TABLE
  taxon
(
  id            bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid          uuid      NOT NULL DEFAULT uuid_generate_v4(),
  taxonomy_uuid uuid      NOT NULL,
  props         jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft   jsonb     NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT taxon_uuid_key UNIQUE (uuid),
  CONSTRAINT taxon_taxonomy_fk FOREIGN KEY (taxonomy_uuid) REFERENCES taxonomy (uuid) ON DELETE CASCADE
);

CREATE INDEX
taxon_taxonomy_idx
ON taxon (taxonomy_uuid);

CREATE TABLE
  taxon_vernacular_name
(
  id          bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),
  taxon_uuid  uuid      NOT NULL,
  props       jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft jsonb     NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (id),
  CONSTRAINT taxon_vernacular_name_uuid_key UNIQUE (uuid),
  CONSTRAINT taxon_vernacular_name_taxon_fk FOREIGN KEY (taxon_uuid) REFERENCES taxon (uuid) ON DELETE CASCADE
);

CREATE INDEX
taxon_vernacular_name_taxon_idx
ON taxon_vernacular_name (taxon_uuid);

CREATE UNIQUE INDEX
taxon_props_code_idx
ON taxon (taxonomy_uuid, ((props||props_draft)->>'code'));

CREATE UNIQUE INDEX
taxon_props_scientific_name_idx
ON taxon (taxonomy_uuid, ((props||props_draft)->>'scientificName'));

CREATE UNIQUE INDEX
taxon_vernacular_name_props_lang_name_idx
ON taxon_vernacular_name (taxon_uuid, (props||props_draft->>'lang'), (props||props_draft->>'name'));
