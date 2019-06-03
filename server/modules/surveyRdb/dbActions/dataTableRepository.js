const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')

const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const DataTable = require('../schemaRdb/dataTable')

const SurveySchemaRepositoryUtils = require('../../survey/repository/surveySchemaRepositoryUtils')

/**
 * Returns a list of items for each record containing duplicate entities.
 * Each item is in the format:
 * {
 *   uuid, //record uuid,
 *   validation: {}, //record validation object,
     node_key_uuid_by_node_def_uuid: {
       nodeKeyDefUuid1: [nodeKeyUuid1, nodeKeyUuid2, ...],
       nodeKeyDefUuid2: [nodeKeyUuid3, nodeKeyUuid4, ...]
     } //indexed object of node uuids (array) by key node def uuid
 * }
 */
const fetchRecordsWithDuplicateEntities = async (survey, nodeDefEntity, nodeDefKeys, client) => {
  const surveyId = Survey.getId(survey)

  const nodeKeyUuidByNodeDefUuidAlias = 'node_key_uuid_by_node_def_uuid'

  const tableName = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(nodeDefEntity)}`

  const aliasA = 'e1'
  const aliasB = 'e2'

  const equalKeysCondition = R.pipe(
    R.map(nodeDefKey => `${aliasA}.${NodeDefTable.getColName(nodeDefKey)} = ${aliasB}.${NodeDefTable.getColName(nodeDefKey)}`),
    R.join(' AND '),
  )(nodeDefKeys)

  const nodeKeyUuidByNodeDefUuidCol = R.pipe(
    R.map(nodeDefKey => {
      const nodeDefUuid = NodeDef.getUuid(nodeDefKey)
      return `'${nodeDefUuid}', json_agg(${aliasA}.${DataTable.colNameMeta}#>>'{"${DataTable.keysMeta.nodeUuidByDef}","${nodeDefUuid}"}')`
    }),
    R.join(', '),
    str => `json_build_object(${str}) AS ${nodeKeyUuidByNodeDefUuidAlias}`
  )(nodeDefKeys)

  return await client.any(`
    SELECT r.uuid, r.validation, ${nodeKeyUuidByNodeDefUuidCol}
    FROM ${tableName} ${aliasA}
      JOIN ${SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)}.record r ON r.uuid = ${aliasA}.${DataTable.colNameRecordUuuid} 
    WHERE EXISTS (
      SELECT ${aliasB}.${DataTable.colNameUuuid}
      FROM ${tableName} ${aliasB}
        WHERE ${aliasA}.${DataTable.colNameUuuid} != ${aliasB}.${DataTable.colNameUuuid}
        AND ${aliasA}.${DataTable.colNameRecordUuuid} = ${aliasB}.${DataTable.colNameRecordUuuid}
        AND ${aliasA}.${DataTable.colNameParentUuuid} = ${aliasB}.${DataTable.colNameParentUuuid}
        AND (${equalKeysCondition})
      )
    GROUP BY r.uuid, r.validation
  `)
}

module.exports = {
  fetchRecordsWithDuplicateEntities
}