CREATE TABLE
    node_def
(
    id                   bigserial NOT NULL,
    uuid                 uuid      NOT NULL          DEFAULT uuid_generate_v4(),
    parent_uuid          uuid,
    type                 varchar   NOT NULL,
    deleted              boolean   NOT NULL          DEFAULT false,
    analysis             boolean   NOT NULL          DEFAULT false,
    props                jsonb                       DEFAULT '{}'::jsonb,
    props_draft          jsonb                       DEFAULT '{}'::jsonb,
    props_advanced       jsonb                       DEFAULT '{}'::jsonb,
    props_advanced_draft jsonb                       DEFAULT '{}'::jsonb,
    meta                 jsonb                       DEFAULT '{}'::jsonb,
    date_created         TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
    date_modified        TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
    PRIMARY KEY (id),
    CONSTRAINT node_def_uuid_idx UNIQUE (uuid),
    CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);


CREATE TABLE
    record
(
    uuid         uuid        NOT NULL        DEFAULT uuid_generate_v4(),
    owner_uuid   uuid        NOT NULL,
    step         varchar(63) NOT NULL,
    cycle        integer     NOT NULL,
    date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
    preview      boolean                     DEFAULT FALSE,
    validation   jsonb       NOT NULL        DEFAULT '{}'::jsonb,

    PRIMARY KEY (uuid),
    CONSTRAINT record_user_fk FOREIGN KEY (owner_uuid) REFERENCES "user" ("uuid")
);

CREATE INDEX record_preview_idx ON record (preview);

CREATE TABLE
    node
(
    id            bigserial NOT NULL,
    uuid          uuid      NOT NULL          DEFAULT uuid_generate_v4(),
    record_uuid   uuid      NOT NULL,
    parent_uuid   uuid,
    node_def_uuid uuid      NOT NULL,
    value         jsonb,
    meta          jsonb     NOT NULL          DEFAULT '{}'::jsonb,
    date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
    date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,

    PRIMARY KEY (uuid),
    CONSTRAINT node_id_unique_idx UNIQUE (id),
    CONSTRAINT node_record_fk FOREIGN KEY (record_uuid) REFERENCES "record" ("uuid") ON DELETE CASCADE,
    CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE,
    CONSTRAINT node_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node" ("uuid") ON DELETE CASCADE
);

CREATE INDEX node_record_idx ON node (record_uuid);
CREATE INDEX node_parent_uuid_idx ON node (parent_uuid);
CREATE INDEX node_node_def_uuid_idx ON node (node_def_uuid);
