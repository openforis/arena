
CREATE TABLE
    "user"
    (
        id BIGSERIAL NOT NULL,
        name VARCHAR(1024) NOT NULL,
        email VARCHAR(1024) NOT NULL,
        password VARCHAR(1024) NOT NULL,
        PRIMARY KEY ("id")
    );


CREATE TABLE
    "role"
    (
        role VARCHAR(255) NOT NULL,
        PRIMARY KEY ("role")
    );

CREATE TABLE
    "user_role"
    (
        user_id BIGINT NOT NULL,
        role VARCHAR(255) NOT NULL,
        CONSTRAINT user_role_user_fkey
          FOREIGN KEY ("user_id") REFERENCES "user" ("id")
          ON DELETE CASCADE,
        CONSTRAINT user_role_role_fkey
          FOREIGN KEY ("role") REFERENCES "role" ("role")
          ON DELETE CASCADE
    );

INSERT INTO role (role)
VALUES ('ADMINISTRATOR');
