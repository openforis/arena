CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  "user"
(
  uuid  uuid NOT NULL DEFAULT uuid_generate_v4(),
  name  VARCHAR,
  email VARCHAR NOT NULL,
  prefs jsonb DEFAULT '{}'::jsonb,

  PRIMARY KEY ("uuid"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);