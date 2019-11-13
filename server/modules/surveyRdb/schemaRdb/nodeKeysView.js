import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const columns = {
  nodeUuid: 'node_uuid',
  keys: 'keys'
}

export const name = '_node_keys'

export const getNameWithSchema = surveyId => `${SchemaRdb.getName(surveyId)}.${name}`