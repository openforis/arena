DROP TABLE
    IF EXISTS node CASCADE;

DROP TABLE
    IF EXISTS record CASCADE;

CREATE TABLE
    record
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        owner_id bigint NOT NULL,
        step varchar(63) NOT NULL,
        date_created TIMESTAMP without TIME zone DEFAULT (now() AT TIME ZONE 'UTC')) NOT NULL,
        PRIMARY KEY (id)
    );

CREATE TABLE
    node
    (
        id bigserial NOT NULL,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        record_id bigint NOT NULL,
        parent_id bigint,
        node_def_id bigint NOT NULL,
        value jsonb,
        file bytea,
        date_created TIMESTAMP without TIME zone DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
        date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
        PRIMARY KEY (id)
    );

ALTER TABLE
    record ADD CONSTRAINT record_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id");

ALTER TABLE
    node ADD CONSTRAINT node_record_fk FOREIGN KEY (record_id) REFERENCES "record" ("id") ON DELETE CASCADE;

ALTER TABLE
    node ADD CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_id) REFERENCES "node_def" ("id") ON DELETE CASCADE;

