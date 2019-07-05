CREATE TABLE
  auth_group
(
  id           bigserial    NOT NULL,
  name         VARCHAR(255) NOT NULL,
  survey_id    bigint REFERENCES survey (id) ON DELETE CASCADE,
  labels       jsonb DEFAULT '{}'::jsonb,
  descriptions jsonb DEFAULT '{}'::jsonb,
  permissions  jsonb DEFAULT '{}'::jsonb,
  record_steps   jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE
  auth_group_user
(
  user_id  bigint REFERENCES "user" (id) ON DELETE CASCADE,
  group_id bigint REFERENCES "auth_group" (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);

CREATE TABLE jwt_token_blacklist
(
  token text,
  expiration bigint,
  PRIMARY KEY (token)
);

-- INSERT ADMIN USER
INSERT INTO
  "user" (email)
VALUES
('openforis.arena@gmail.com');

INSERT INTO auth_group (name, labels, descriptions, permissions, record_steps)
VALUES ('systemAdmin',
        '{"en": "System Administrators"}'::jsonb,
        '{"en": "OF Arena system administrators"}'::jsonb,
        NULL,
        NULL);

INSERT INTO auth_group_user (user_id, group_id)
SELECT id, currval(pg_get_serial_sequence('auth_group', 'id'))
FROM "user"
WHERE email = 'openforis.arena@gmail.com';
