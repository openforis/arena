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
        'Mino Togna',
        'mino.togna@gmail.com',
        '$2b$10$hngGjfyw4LZIjTogmp1gV.Kg.BSU/gYW/15NZfIqwFdtpFyU3/S8q'
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
