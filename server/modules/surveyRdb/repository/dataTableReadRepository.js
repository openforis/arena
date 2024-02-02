import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { db } from '@server/db/db'
import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as SurveySchemaRepositoryUtils from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

/**
 * Returns a list of items for each record containing duplicate entities.
 * Each item is in the format:
 * {
 *   uuid, //record uuid,
 *   validation: {}, //record validation object,
     node_duplicate_uuids: [nodeUuid1, nodeUuid2, ...] //array of duplicate entity uuids
 * }
 */
export const fetchRecordsWithDuplicateEntities = async (survey, cycle, nodeDefEntity, nodeDefKeys, client) => {
  const surveyId = Survey.getId(survey)

  const tableName = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(nodeDefEntity)}`

  const aliasA = 'e1'
  const aliasB = 'e2'

  const getColEqualCondition = (columnName) => `${aliasA}.${columnName} = ${aliasB}.${columnName}`

  const getNullableColEqualCondition = (columnName) =>
    `(${aliasA}.${columnName} IS NULL AND ${aliasB}.${columnName} IS NULL OR ${getColEqualCondition(columnName)})`

  const equalKeysCondition = R.pipe(
    R.map((nodeDefKey) => getNullableColEqualCondition(NodeDefTable.getColumnName(nodeDefKey))),
    R.join(' AND ')
  )(nodeDefKeys)

  const recordAndParentEqualCondition = NodeDef.isRoot(nodeDefEntity)
    ? ''
    : `AND ${getColEqualCondition(DataTable.columnNameRecordUuid)}
         AND ${getColEqualCondition(DataTable.columnNameParentUuid)}`

  return await client.any(
    `
    SELECT r.uuid, r.validation, json_agg(${aliasA}.uuid) as node_duplicate_uuids
    FROM ${SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)}.record r
      JOIN ${tableName} ${aliasA}
        ON r.uuid = ${aliasA}.${DataTable.columnNameRecordUuid} 
    WHERE
      r.cycle = $1 
      AND EXISTS (
      --exists a node entity with the same key node values in the same record (if not root entity) and in the same parent node entity
      SELECT ${aliasB}.${DataTable.columnNameUuid}
      FROM ${tableName} ${aliasB}
      WHERE
        --same cycle
        ${aliasB}.${DataTable.columnNameRecordCycle} = $1
        --different node uuid 
        AND ${aliasA}.${DataTable.columnNameUuid} != ${aliasB}.${DataTable.columnNameUuid}
        ${recordAndParentEqualCondition}
        --same key node(s) values
        AND (${equalKeysCondition})
      )
    GROUP BY r.uuid, r.validation
    `,
    [cycle]
  )
}

export const fetchEntityKeysByRecordAndNodeDefUuid = async (
  survey,
  entityDefUuid,
  recordUuid,
  nodeUuid = null,
  client = db
) => {
  const surveyId = Survey.getId(survey)
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const table = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(entityDef)}`
  const entityDefKeys = Survey.getNodeDefKeys(entityDef)(survey)
  const keyColumns = R.pipe(R.map(NodeDefTable.getColumnName), R.join(', '))(entityDefKeys)

  return await client.oneOrNone(
    `
    SELECT
      ${keyColumns}
    FROM
      ${table}
    WHERE
      ${DataTable.columnNameRecordUuid} = $1
      ${NodeDef.isRoot(entityDef) ? '' : `AND ${DataTable.columnNameUuid} = $2`}`,
    [recordUuid, nodeUuid],
    (row) => (row ? Object.values(row) : [])
  )
}
