DROP TABLE
    IF EXISTS user_group;

DROP TABLE
    IF EXISTS survey_group;

DROP TABLE
    IF EXISTS "group";

-- DROP TABLE
--     IF EXISTS "role";

-- TODO delete IF NOT EXISTS
CREATE TABLE
    group_role
    (
        id bigserial NOT NULL,
        role varchar(255),
        labels jsonb DEFAULT '{}'::jsonb,
        descriptions jsonb DEFAULT '{}'::jsonb,
        permissions jsonb DEFAULT '{}'::jsonb,
        data_steps jsonb DEFAULT '{}'::jsonb,
        PRIMARY KEY (id)
    );

-- ALTER TABLE
--     role
--     ADD COLUMN IF NOT EXISTS id bigserial PRIMARY KEY NOT NULL,
--     ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '{}'::jsonb,
--     ADD COLUMN IF NOT EXISTS descriptions jsonb DEFAULT '{}'::jsonb,
--     ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
--     ADD COLUMN IF NOT EXISTS data_steps jsonb DEFAULT '{}'::jsonb;

CREATE TABLE
    "group"
    (
        id bigserial NOT NULL,
        labels jsonb DEFAULT '{}'::jsonb,
        descriptions jsonb DEFAULT '{}'::jsonb,
        role_id bigint REFERENCES group_role (id),
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

-- DELETE FROM "role";

INSERT INTO group_role (role, labels, descriptions, permissions, data_steps) VALUES
    (
        'surveyAdmin',
        '{"en": "Survey adminisntrator"}',
        '{"en": "Can create surveys etc."}',
        '["permissionsEdit", "surveyEdit", "recordView", "recordCreate", "recordDataEdit", "userInvite"]',
        '[1, 2, 3]'
    ),
    (
        'surveyEditor',
        '{"en": "Survey editor"}',
        '{"en": "Can edit surveys"}',
        '["surveyEdit", "recordView", "recordCreate", "recordDataEdit"]',
        '[1, 2, 3]'
    ),
    (
        'dataEditor',
        '{"en": "Data editor"}',
        '{"en": "Can insert and edit data"}',
        '["recordView", "recordCreate", "recordDataEdit"]',
        '[1]'
    ),
    (
        'dataCleanser',
        '{"en": "Data cleanser"}', '{"en": "Cleanses the data"}',
        '["recordView", "recordCreate", "recordDataEdit"]',
        '[1, 2]'
    ),
    (
        'dataAnalyst',
        '{"en": "Data analyst"}',
        '{"en": "Analyzes the data"}',
        '["recordView", "recordCreate", "recordDataEdit"]',
        '[1, 2, 3]'
    );

INSERT INTO "group" (labels, descriptions)
VALUES (
    '{"en": "System Administrators"}',
    '{"en": "OF Arena system administrators"}'
);

INSERT INTO user_group
    SELECT id, currval(pg_get_serial_sequence('group','id'))
    FROM "user"
    WHERE "user".name = 'Admin';
