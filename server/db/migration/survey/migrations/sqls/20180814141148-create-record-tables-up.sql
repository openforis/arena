CREATE TABLE
  node_def
(
  id                   bigserial NOT NULL,
  uuid                 uuid      NOT NULL DEFAULT uuid_generate_v4(),

  parent_uuid          uuid,
  type                 varchar   NOT NULL,

  deleted              boolean   NOT NULL DEFAULT false,

  props                jsonb              DEFAULT '{}'::jsonb,
  props_draft          jsonb              DEFAULT '{}'::jsonb,

  props_advanced       jsonb              DEFAULT '{}'::jsonb,
  props_advanced_draft jsonb              DEFAULT '{}'::jsonb,

  date_created         TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified        TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (id),
  CONSTRAINT node_def_uuid_idx UNIQUE (uuid),
  CONSTRAINT node_def_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);


CREATE TABLE
  record
(
  id           bigserial   NOT NULL,
  uuid         uuid        NOT NULL DEFAULT uuid_generate_v4(),
  owner_id     bigint      NOT NULL,
  step         varchar(63) NOT NULL,
  date_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT record_user_fk FOREIGN KEY (owner_id) REFERENCES "user" ("id")
);

CREATE TABLE
  node
(
  id            bigserial NOT NULL,
  uuid          uuid      NOT NULL DEFAULT uuid_generate_v4(),
  record_id     bigint    NOT NULL,
  parent_uuid   uuid,
  node_def_uuid uuid      NOT NULL,
  value         jsonb,
  file          bytea,
  date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
  date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT node_uuid_idx UNIQUE (uuid),
  CONSTRAINT node_record_fk FOREIGN KEY (record_id) REFERENCES "record" ("id") ON DELETE CASCADE,
  CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE,
  CONSTRAINT node_parent_fk FOREIGN KEY (parent_uuid) REFERENCES "node" ("uuid") ON DELETE CASCADE
);

