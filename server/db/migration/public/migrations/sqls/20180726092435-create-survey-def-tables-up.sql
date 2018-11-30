CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  survey
(
  id          bigserial NOT NULL,
  uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),

  published   boolean   NOT NULL DEFAULT false,
  draft       boolean   NOT NULL DEFAULT true,

  props       jsonb              DEFAULT '{}'::jsonb,
  props_draft jsonb              DEFAULT '{}'::jsonb,

  owner_id    bigint    NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT survey_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id")
);

CREATE TABLE
  node_def
(
  id                   bigserial NOT NULL,
  uuid                 uuid      NOT NULL DEFAULT uuid_generate_v4(),

  survey_id            bigint    NOT NULL,
  parent_uuid          uuid,
  type                 varchar   NOT NULL,

  deleted              boolean   NOT NULL DEFAULT false,

  props                jsonb              DEFAULT '{}'::jsonb,
  props_draft          jsonb              DEFAULT '{}'::jsonb,

  props_advanced       jsonb              DEFAULT '{}'::jsonb,
  props_advanced_draft jsonb              DEFAULT '{}'::jsonb,

  date_created         TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified        TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (id),
  CONSTRAINT node_def_uuid_idx UNIQUE (uuid),
  CONSTRAINT node_def_survey_fk FOREIGN KEY (survey_id) REFERENCES "survey" ("id") ON DELETE CASCADE,
  CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);



