CREATE TABLE
    user_sessions
    (
        sid CHARACTER VARYING NOT NULL,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (sid)
    )