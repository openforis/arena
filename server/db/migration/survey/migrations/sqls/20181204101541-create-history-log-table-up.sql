CREATE TABLE activity_log
(
  id           BIGSERIAL NOT NULL,
  type         VARCHAR(255) NOT NULL,
  user_uuid    uuid NOT NULL,
  content      jsonb NOT NULL DEFAULT '{}'::jsonb,
  system       boolean NOT NULL DEFAULT false,
  date_created TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  PRIMARY KEY (id),
  CONSTRAINT activity_log_user_fk FOREIGN KEY (user_uuid) REFERENCES "user" ("uuid")
);

CREATE INDEX activity_log_user_aggregated_idx ON activity_log (
  (date_created::date) DESC,
  user_uuid,
  type,
  (content->>'uuid') NULLS LAST,
  date_created DESC
) WHERE NOT system;
