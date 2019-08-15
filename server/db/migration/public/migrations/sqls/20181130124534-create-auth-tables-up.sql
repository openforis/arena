CREATE TABLE
  auth_group
(
  uuid         uuid NOT NULL DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  survey_uuid  uuid REFERENCES survey (uuid) ON DELETE CASCADE,
  permissions  jsonb DEFAULT '{}'::jsonb,
  record_steps jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (uuid)
);

CREATE TABLE
  auth_group_user
(
  user_uuid  uuid REFERENCES "user" (uuid) ON DELETE CASCADE,
  group_uuid uuid REFERENCES "auth_group" (uuid) ON DELETE CASCADE,
  PRIMARY KEY (user_uuid, group_uuid)
);

CREATE TABLE jwt_token_blacklist
(
  token_jti  VARCHAR,
  expiration bigint,
  PRIMARY KEY (token_jti)
);

-- INSERT ADMIN USER
INSERT INTO "user" (name, email)
VALUES ('Admin', 'admin@openforis.org');

INSERT INTO auth_group (name)
VALUES ('systemAdmin');

INSERT INTO auth_group_user (user_uuid, group_uuid)
SELECT u.uuid, g.uuid
FROM "user" u, "auth_group" g
WHERE u.email = 'admin@openforis.org' AND g.name = 'systemAdmin';
