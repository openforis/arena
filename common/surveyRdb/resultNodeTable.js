import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const tableName = `${SchemaRdb.resultTablePrefix}_node`

// Table column names: DO NOT REORDER THEM (order used in in rFilePersistResults)
export const colNames = {
  uuid: 'uuid',
  processingChainUuid: 'processing_chain_uuid',
  processingStepUuid: 'processing_step_uuid',
  recordUuid: 'record_uuid',
  parentUuid: 'parent_uuid',
  nodeDefUuid: 'node_def_uuid',
  value: 'value',
}
