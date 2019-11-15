CREATE TABLE
  processing_chain
  (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    cycle VARCHAR(2) NOT NULL,
    date_created TIMESTAMP without TIME zone DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
    date_modified TIMESTAMP without TIME zone DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
    date_executed TIMESTAMP without TIME zone,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    status_exec VARCHAR(15),
    PRIMARY KEY (uuid)
  );

CREATE TABLE
  processing_step
  (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    processing_chain_uuid uuid NOT NULL,
    index INTEGER DEFAULT 0 NOT NULL,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    PRIMARY KEY (uuid),
    CONSTRAINT processingstep_chain_fk FOREIGN KEY (processing_chain_uuid) REFERENCES "processing_chain" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstep_index_idx UNIQUE (processing_chain_uuid, index)
  );

CREATE TABLE
  processing_step_calculation
  (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    processing_step_uuid uuid NOT NULL,
    node_def_uuid uuid,
    index INTEGER DEFAULT 0 NOT NULL,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    PRIMARY KEY (uuid),
    CONSTRAINT processingstepcalculation_processingstep_fk FOREIGN KEY (processing_step_uuid) REFERENCES "processing_step" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstepcalculation_nodedef_fk FOREIGN KEY (node_def_uuid) REFERENCES "node_def" ("uuid") ON DELETE CASCADE,
    CONSTRAINT processingstepcalculation_index_idx UNIQUE (processing_step_uuid, index)
  );