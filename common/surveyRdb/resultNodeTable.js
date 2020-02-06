import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const tableName = `${SchemaRdb.resultTablePrefix}_node`

export const colNames = {
  processingChainUuid: 'processing_chain_uuid',
  processingStepUuid: 'processing_step_uuid',
  parentUuid: 'parent_uuid',
  nodeDefUuid: 'node_def_uuid',
  value: 'value',
}
