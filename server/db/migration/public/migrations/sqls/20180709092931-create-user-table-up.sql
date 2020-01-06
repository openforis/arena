CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_status AS ENUM ('ACCEPTED', 'INVITED', 'FORCE_CHANGE_PASSWORD');

CREATE TABLE
  "user"
(
  uuid            uuid            NOT NULL DEFAULT uuid_generate_v4(),
  name            VARCHAR(128)        NULL,
  email           VARCHAR         NOT NULL,
  password        VARCHAR         NOT NULL,
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