CREATE TABLE
  file
(
  id           bigserial NOT NULL,
  uuid         uuid      NOT NULL DEFAULT uuid_generate_v4(),
  props        jsonb              DEFAULT '{}'::jsonb,
  content      bytea     NOT NULL,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,

  PRIMARY KEY (id)
);
