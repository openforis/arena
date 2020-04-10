CREATE TABLE
  processing_chain
  (
    uuid           uuid        NOT NULL DEFAULT uuid_generate_v4(),
    date_created   TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    date_modified  TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    date_executed  TIMESTAMP       NULL,
    props          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    validation     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    status_exec    VARCHAR(32)     NULL,
    script_common  TEXT            NULL,
    PRIMARY KEY (uuid)
  );

CREATE TABLE
  processing_step
  (
    uuid                   uuid    NOT NULL DEFAULT uuid_generate_v4(),
    processing_chain_uuid  uuid    NOT NULL,
    index                  integer NOT NULL DEFAULT 0,
    props                  jsonb   NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (uuid),
    CONSTRAINT processingstep_chain_fk FOREIGN KEY (processing_chain_uuid) REFERENCES "processing_chain" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstep_index_idx UNIQUE (processing_chain_uuid, index)
  );

CREATE TABLE
  processing_step_calculation
  (
    uuid                  uuid    NOT NULL DEFAULT uuid_generate_v4(),
    processing_step_uuid  uuid    NOT NULL,
    node_def_uuid         uuid        NULL,
    index                 integer NOT NULL DEFAULT 0,
    props                 jsonb   NOT NULL DEFAULT '{}'::jsonb,
    script                text        NULL,
    PRIMARY KEY (uuid),
    CONSTRAINT processingstepcalculation_processingstep_fk FOREIGN KEY (processing_step_uuid) REFERENCES "processing_step" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstepcalculation_nodedef_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstepcalculation_index_idx UNIQUE (processing_step_uuid, index)
  );

CREATE TABLE
  user_analysis
(
  password VARCHAR(36) NOT NULL DEFAULT uuid_generate_v4()
);
