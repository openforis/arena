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
  parent_id     bigint,
  node_def_id   bigint    NOT NULL,
  value         jsonb,
  file          bytea,
  date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
  date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT node_record_fk FOREIGN KEY (record_id) REFERENCES "record" ("id") ON DELETE CASCADE,
  CONSTRAINT node_node_def_fk FOREIGN KEY (node_def_id) REFERENCES "node_def" ("id") ON DELETE CASCADE,
  CONSTRAINT node_parent_fk FOREIGN KEY (parent_id) REFERENCES "node" ("id") ON DELETE CASCADE
);

