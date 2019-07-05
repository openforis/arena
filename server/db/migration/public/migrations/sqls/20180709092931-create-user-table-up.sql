CREATE TABLE
  "user"
(
  id       BIGSERIAL     NOT NULL,
  email    VARCHAR(1024) NOT NULL,
  prefs    jsonb DEFAULT '{}'::jsonb,

  PRIMARY KEY ("id"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);