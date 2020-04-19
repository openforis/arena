import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

/**
 * @deprecated - Use TableResultNode.
 */
export const tableName = `${SchemaRdb.resultTablePrefix}_node`

/**
 * @deprecated - Use TableResultNode.
 */
export const colNames = {
  uuid: 'uuid',
  processingChainUuid: 'processing_chain_uuid',
  processingStepUuid: 'processing_step_uuid',
  recordUuid: 'record_uuid',
  parentUuid: 'parent_uuid',
  nodeDefUuid: 'node_def_uuid',
  value: 'value',
}
