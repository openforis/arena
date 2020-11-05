import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const columns = {
  nodeId: 'node_id',
  nodeUuid: 'node_uuid',
  nodeDefUuid: 'node_def_uuid',
  recordUuid: 'record_uuid',
  keys: 'keys',
}

export const name = '_node_keys'

export const getNameWithSchema = (surveyId) => `${SchemaRdb.getName(surveyId)}.${name}`
