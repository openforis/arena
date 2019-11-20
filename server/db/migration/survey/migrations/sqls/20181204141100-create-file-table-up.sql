CREATE TABLE
  file
(
  id           bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  uuid         uuid      NOT NULL DEFAULT uuid_generate_v4(),
  props        jsonb     NOT NULL DEFAULT '{}'::jsonb,
  content      bytea     NOT NULL,
  date_created TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (id)
);