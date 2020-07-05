INSERT INTO "user" (name, email, PASSWORD, status)
    VALUES ('Tester', 'test@arena.com', '$2a$10$6y2oUZVrQ7aXed.47h4sHeJA8VVA2dW9ObtO/XLveXSzQKBvTOyou', 'ACCEPTED');

INSERT INTO auth_group_user (user_uuid, group_uuid)
SELECT
    u.uuid,
    g.uuid
FROM
    "user" u
    JOIN auth_group g ON u.email = 'test@arena.com'
        AND g.name = 'systemAdmin';

