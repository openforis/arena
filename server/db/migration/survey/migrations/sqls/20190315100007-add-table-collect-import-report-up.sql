CREATE TABLE
  collect_import_report
(
  id                   bigint    NOT NULL GENERATED ALWAYS AS IDENTITY,
  node_def_uuid        uuid      NOT NULL DEFAULT uuid_generate_v4(),

  resolved             boolean   NOT NULL DEFAULT false,

  props                jsonb     NOT NULL DEFAULT '{}'::jsonb,

  date_created         TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  date_modified        TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY (id),
  CONSTRAINT collect_import_report_node_def_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE
);