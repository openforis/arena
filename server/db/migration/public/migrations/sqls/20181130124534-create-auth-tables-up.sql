CREATE TABLE
  auth_group
(
  uuid         uuid         NOT NULL DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  survey_uuid  uuid             NULL REFERENCES survey (uuid) ON DELETE CASCADE,
  permissions  jsonb        NOT NULL DEFAULT '{}'::jsonb,
  record_steps jsonb        NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (uuid)
);

CREATE TABLE
  auth_group_user
(
  user_uuid  uuid REFERENCES "user" (uuid) ON DELETE CASCADE,
  group_uuid uuid REFERENCES "auth_group" (uuid) ON DELETE CASCADE,
  PRIMARY KEY (user_uuid, group_uuid)
);

INSERT INTO auth_group (name)
VALUES ('systemAdmin');
