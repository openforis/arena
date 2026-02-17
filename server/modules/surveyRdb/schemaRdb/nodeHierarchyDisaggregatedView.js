import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const columns = {
  nodeId: 'node_id',
  nodeIId: 'node_i_id',
  nodeDefUuid: 'node_def_uuid',
  nodeAncestorId: 'node_ancestor_id',
  nodeAncestorIId: 'node_ancestor_i_id',
  nodeDefAncestorUuid: 'node_def_ancestor_uuid',
  recordUuid: 'record_uuid',
}

export const name = '_node_hierarchy_disaggregated'

export const getNameWithSchema = (surveyId) => `${SchemaRdb.getName(surveyId)}.${name}`
