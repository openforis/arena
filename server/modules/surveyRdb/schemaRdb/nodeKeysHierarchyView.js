import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const columns = {
  nodeUuid: 'node_uuid',
  nodeId: 'node_id',
  nodeDefUuid: 'node_def_uuid',
  keysHierarchy: 'keys_hierarchy',
  keysSelf: 'keys_self',
  recordUuid: 'record_uuid',
}

export const name = '_node_keys_hierarchy'

export const getNameWithSchema = (surveyId) => `${SchemaRdb.getName(surveyId)}.${name}`
