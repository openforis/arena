CREATE TABLE
  "user"
(
  id       BIGSERIAL     NOT NULL,
  name     VARCHAR(1024) NOT NULL,
  email    VARCHAR(1024) NOT NULL,
  password VARCHAR(1024) NOT NULL,
  PRIMARY KEY ("id")
);


CREATE TABLE
  user_sessions
(
  sid    CHARACTER VARYING NOT NULL,
  sess   JSON              NOT NULL,
  expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
  PRIMARY KEY (sid)
);

CREATE TABLE
  auth_group
(
  id           bigserial    NOT NULL,
  name         VARCHAR(255) NOT NULL,
  survey_id    bigint REFERENCES survey (id) ON DELETE CASCADE,
  labels       jsonb DEFAULT '{}'::jsonb,
  descriptions jsonb DEFAULT '{}'::jsonb,
  permissions  jsonb DEFAULT '{}'::jsonb,
  data_steps   jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE
  auth_group_user
(
  user_id  bigint REFERENCES "user" (id) ON DELETE CASCADE,
  group_id bigint REFERENCES "auth_group" (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

ALTER TABLE
  "user"
  ADD CONSTRAINT user_unique_email_ix UNIQUE ("email");

INSERT INTO
  "user" (name, email, password)
VALUES
('Admin', 'admin@openforis.org', '$2b$10$PGiD7cS.ESkAI4NIbuJ.9OYDEsfnMl8wNoETWoi03JWhXXJIwLDte');

INSERT INTO auth_group (name, labels, descriptions, permissions, data_steps)
VALUES ('systemAdmin',
        '{"en": "System Administrators"}'::jsonb,
        '{"en": "OF Arena system administrators"}'::jsonb,
        NULL,
        NULL);

INSERT INTO auth_group_user (user_id, group_id)
SELECT id, currval(pg_get_serial_sequence('auth_group', 'id'))
FROM "user"
WHERE email = 'admin@openforis.org';
