CREATE TABLE
  "user"
(
  id                    BIGSERIAL     NOT NULL,
  cognito_username      VARCHAR,
  name                  VARCHAR(1024) NOT NULL,
  email                 VARCHAR(1024) NOT NULL,
  prefs                 jsonb DEFAULT '{}'::jsonb,

  PRIMARY KEY ("id"),
  CONSTRAINT user_cognito_username_idx UNIQUE ("cognito_username"),
  CONSTRAINT user_email_idx UNIQUE ("email")
);