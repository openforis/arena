CREATE TABLE
  collect_import_report
(
  id                   bigserial NOT NULL,
  node_def_uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),

  resolved             boolean   NOT NULL DEFAULT false,

  props                jsonb              DEFAULT '{}'::jsonb,

  date_created         TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified        TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (id),
  CONSTRAINT collect_import_report_node_def_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);
