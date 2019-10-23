CREATE TABLE activity_log
(
  id           BIGSERIAL NOT NULL,
  type         VARCHAR(255) NOT NULL,
  user_uuid    uuid NOT NULL,
  content      jsonb DEFAULT '{}'::jsonb,
  system       boolean NOT NULL DEFAULT false,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  PRIMARY KEY (id),
  CONSTRAINT activity_log_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid")
)
