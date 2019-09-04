CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
  "user"
(
  uuid  uuid NOT NULL DEFAULT uuid_generate_v4(),
  name  VARCHAR(128),
  email VARCHAR NOT NULL,
  prefs jsonb DEFAULT '{}'::jsonb,
  profile_picture bytea

  PRIMARY KEY ("uuid"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);