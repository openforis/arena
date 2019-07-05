CREATE TABLE
  "user"
(
  id       BIGSERIAL     NOT NULL,
  email    VARCHAR(1024) NOT NULL,
  prefs    jsonb DEFAULT '{}'::jsonb,

  PRIMARY KEY ("id"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);

CREATE TABLE
  user_sessions
(
  sid    CHARACTER VARYING NOT NULL,
  sess   JSON              NOT NULL,
  expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,

  PRIMARY KEY (sid)
);