CREATE TABLE
    node_def
(
    id                   bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
    uuid                 uuid      NOT NULL DEFAULT uuid_generate_v4(),
    parent_uuid          uuid          NULL,
    type                 varchar   NOT NULL,
    deleted              boolean   NOT NULL DEFAULT false,
    analysis             boolean   NOT NULL DEFAULT false,
    virtual              boolean   NOT NULL DEFAULT false,
    props                jsonb     NOT NULL DEFAULT '{}'::jsonb,
    props_draft          jsonb     NOT NULL DEFAULT '{}'::jsonb,
    props_advanced       jsonb     NOT NULL DEFAULT '{}'::jsonb,
    props_advanced_draft jsonb     NOT NULL DEFAULT '{}'::jsonb,
    meta                 jsonb     NOT NULL DEFAULT '{}'::jsonb,
    date_created         TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    date_modified        TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    PRIMARY KEY (id),
    CONSTRAINT node_def_uuid_idx UNIQUE (uuid),
    CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);


CREATE TABLE
    record
(
    uuid         uuid        NOT NULL DEFAULT uuid_generate_v4(),
    owner_uuid   uuid        NOT NULL,
    step         varchar(63) NOT NULL,
    cycle        varchar(2)  NOT NULL CHECK (cycle SIMILAR TO '[0-9]|[1-9][0-9]' ),
    date_created TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    preview      boolean     NOT NULL DEFAULT FALSE,
    validation   jsonb       NOT NULL DEFAULT '{}'::jsonb,

    PRIMARY KEY (uuid),
    CONSTRAINT record_user_fk FOREIGN KEY (owner_uuid) REFERENCES "user" ("uuid")
);

CREATE INDEX record_preview_idx ON record (preview);

CREATE TABLE
    node
(
    id            bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
    uuid          uuid      NOT NULL DEFAULT uuid_generate_v4(),
    record_uuid   uuid      NOT NULL,
    parent_uuid   uuid          NULL,
    node_def_uuid uuid      NOT NULL,
    value         jsonb         NULL DEFAULT '{}'::jsonb,
    meta          jsonb     NOT NULL DEFAULT '{}'::jsonb,
    date_created  TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    date_modified TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

    PRIMARY KEY (uuid),
    CONSTRAINT node_id_unique_idx UNIQUE (id),
    CONSTRAINT node_record_fk FOREIGN KEY (record_uuid) REFERENCES "record" ("uuid") ON DELETE CASCADE,
    CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE,
    CONSTRAINT node_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node" ("uuid") ON DELETE CASCADE
);

CREATE INDEX node_record_idx ON node (record_uuid);
CREATE INDEX node_parent_uuid_idx ON node (parent_uuid);
CREATE INDEX node_node_def_uuid_idx ON node (node_def_uuid);
