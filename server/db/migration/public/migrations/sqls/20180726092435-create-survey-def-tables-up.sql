CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  survey
(
  id            bigserial NOT NULL,
  uuid          uuid      NOT NULL DEFAULT uuid_generate_v4(),

  published     boolean   NOT NULL DEFAULT false,
  draft         boolean   NOT NULL DEFAULT true,

  date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  props         jsonb              DEFAULT '{}'::jsonb,
  props_draft   jsonb              DEFAULT '{}'::jsonb,

  owner_id      bigint    NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT survey_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id")
);