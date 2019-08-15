CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  survey
(
  id            bigserial NOT NULL,
  uuid          uuid      UNIQUE NOT NULL DEFAULT uuid_generate_v4(),

  published     boolean   NOT NULL DEFAULT false,
  draft         boolean   NOT NULL DEFAULT true,

  date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  props         jsonb              DEFAULT '{}'::jsonb,
  props_draft   jsonb              DEFAULT '{}'::jsonb,

  meta          jsonb              DEFAULT '{}'::jsonb,

  owner_uuid    uuid      NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT survey_user_fk FOREIGN KEY (owner_uuid) REFERENCES "user" ("uuid")
);