CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  "user"
(
  uuid            uuid            NOT NULL DEFAULT uuid_generate_v4(),
  name            VARCHAR(128)        NULL,
  email           VARCHAR         NOT NULL,
  prefs           jsonb           NOT NULL DEFAULT '{}'::jsonb,
  profile_picture bytea               NULL,

  PRIMARY KEY ("uuid"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);