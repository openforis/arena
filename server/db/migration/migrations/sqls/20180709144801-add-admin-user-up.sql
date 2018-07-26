INSERT
INTO
    "user"
    (
        name,
        email,
        password
    )
    VALUES
    (
        'Admin',
        'admin@openforis.org',
        '$2b$10$PGiD7cS.ESkAI4NIbuJ.9OYDEsfnMl8wNoETWoi03JWhXXJIwLDte'
    );

INSERT
INTO
    user_role
    (
        user_id,
        role
    )
    VALUES
    (
        (SELECT LASTVAL() FROM user_id_seq),
        'ADMINISTRATOR'
    );
