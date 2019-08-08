CREATE TABLE activity_log
(
  id           BIGSERIAL NOT NULL,
  type         VARCHAR(255) NOT NULL,
  user_uuid    uuid NOT NULL,
  params       jsonb DEFAULT '{}'::jsonb,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  PRIMARY KEY (id),
  CONSTRAINT activity_log_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid")
)
