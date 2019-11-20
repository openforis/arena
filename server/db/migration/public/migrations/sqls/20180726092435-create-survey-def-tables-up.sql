CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  survey
(
  id            bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid          uuid      NOT NULL UNIQUE DEFAULT uuid_generate_v4(),

  published     boolean   NOT NULL DEFAULT false,
  draft         boolean   NOT NULL DEFAULT true,

  date_created  TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  props         jsonb     NOT NULL DEFAULT '{}'::jsonb,
  props_draft   jsonb     NOT NULL DEFAULT '{}'::jsonb,

  meta          jsonb     NOT NULL DEFAULT '{}'::jsonb,

  owner_uuid    uuid      NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT survey_user_fk FOREIGN KEY (owner_uuid) REFERENCES "user" ("uuid")
);