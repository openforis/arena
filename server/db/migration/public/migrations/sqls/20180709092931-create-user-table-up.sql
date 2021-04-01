CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('ACCEPTED', 'INVITED', 'FORCE_CHANGE_PASSWORD');

CREATE TABLE
  "user"
(
  uuid            uuid            NOT NULL DEFAULT uuid_generate_v4(),
  name            VARCHAR(128)        NULL,
  email           VARCHAR         NOT NULL,
  password        VARCHAR             NULL,
  prefs           jsonb           NOT NULL DEFAULT '{}'::jsonb,
  profile_picture bytea               NULL,
  status          user_status     NOT NULL,

  PRIMARY KEY ("uuid"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);

CREATE TABLE
  user_sessions
(
  sid    VARCHAR        NOT NULL,
  sess   JSON           NOT NULL,
  expire TIMESTAMP(6)   NOT NULL,

  PRIMARY KEY (sid)
);

CREATE TABLE
  user_reset_password
(
  uuid          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  user_uuid     uuid        NOT NULL,
  date_created  TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (uuid),
  CONSTRAINT user_reset_password_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid") ON DELETE CASCADE
);

CREATE UNIQUE INDEX
user_reset_password_user_idx
ON user_reset_password (user_uuid);
