DROP TABLE
    IF EXISTS user_group;

DROP TABLE
    IF EXISTS survey_group;

DROP TABLE
    IF EXISTS "group";


CREATE TABLE
    "group"
    (
        id bigserial NOT NULL,
        labels jsonb,
        descriptions jsonb,
        role varchar(255),
        data_condition varchar(255),
        PRIMARY KEY (id)
    );

CREATE TABLE
    user_group
    (
        user_id bigint REFERENCES "user" (id) ON DELETE CASCADE,
        group_id bigint REFERENCES "group" (id),
        PRIMARY KEY (user_id, group_id)
    );

CREATE TABLE
    survey_group
    (
        survey_id bigint REFERENCES "survey" (id) ON DELETE CASCADE,
        group_id bigint REFERENCES "group" (id),
        PRIMARY KEY (survey_id, group_id)
    );

-- TODO delete IF NOT EXISTS
ALTER TABLE
    role
    ADD COLUMN IF NOT EXISTS labels jsonb,
    ADD COLUMN IF NOT EXISTS descriptions jsonb,
    ADD COLUMN IF NOT EXISTS permissions jsonb,
    ADD COLUMN IF NOT EXISTS dataSteps jsonb;

INSERT INTO "group" (labels, descriptions)
VALUES (
    '{"en": "System Administrators"}'::jsonb,
    '{"en": "OF Arena system administrators"}'::jsonb);

INSERT INTO user_group
    SELECT id, currval(pg_get_serial_sequence('group','id'))
    FROM "user"
    WHERE "user".name = 'Admin';
