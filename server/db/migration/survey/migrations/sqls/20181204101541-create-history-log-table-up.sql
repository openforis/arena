CREATE TABLE activity_log
(
  id bigserial NOT NULL,
  type VARCHAR(255),
  user_email VARCHAR(1024),
  params jsonb DEFAULT '{}'::jsonb,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  PRIMARY KEY (id)
)
