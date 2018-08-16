CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

DROP TABLE
    IF EXISTS record_update_log CASCADE;

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
        date_created TIMESTAMP without TIME zone DEFAULT now() NOT NULL,
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
        date_created TIMESTAMP without TIME zone DEFAULT now() NOT NULL,
        PRIMARY KEY (id)
    );

CREATE TABLE
    record_update_log
    (
        id bigserial NOT NULL,
        action varchar(31) NOT NULL,
        user_id bigint,
        node jsonb NOT NULL,
        date_created TIMESTAMP without TIME zone DEFAULT now() NOT NULL,
        PRIMARY KEY (id)
    );

ALTER TABLE
    record ADD CONSTRAINT record_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id");

ALTER TABLE
    node ADD CONSTRAINT node_record_fk FOREIGN KEY (record_id) REFERENCES "record" ("id");

ALTER TABLE
    node ADD CONSTRAINT node_parent_fk FOREIGN KEY (parent_id) REFERENCES "node" ("id");

ALTER TABLE
    node ADD CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_id) REFERENCES "node_def" ("id");

ALTER TABLE
    record_update_log ADD CONSTRAINT record_update_log_user_fk FOREIGN KEY (user_id) REFERENCES "user" ("id");
