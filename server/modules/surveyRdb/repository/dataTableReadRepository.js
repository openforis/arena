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
export const fetchRecordsWithDuplicateEntities = async (
  survey,
  cycle,
  nodeDefEntity,
  nodeDefKeys,
  client,
) => {
  const surveyId = Survey.getId(survey)

  const tableName = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(
    nodeDefEntity,
  )}`

  const aliasA = 'e1'
  const aliasB = 'e2'

  const getColEqualCondition = colName =>
    `${aliasA}.${colName} = ${aliasB}.${colName}`

  const getNullableColEqualCondition = colName =>
    `(${aliasA}.${colName} IS NULL AND ${aliasB}.${colName} IS NULL OR ${getColEqualCondition(
      colName,
    )})`

  const equalKeysCondition = R.pipe(
    R.map(nodeDefKey =>
      getNullableColEqualCondition(NodeDefTable.getColName(nodeDefKey)),
    ),
    R.join(' AND '),
  )(nodeDefKeys)

  const recordAndParentEqualCondition = NodeDef.isRoot(nodeDefEntity)
    ? ''
    : `AND ${getColEqualCondition(DataTable.colNameRecordUuuid)}
         AND ${getColEqualCondition(DataTable.colNameParentUuuid)}`

  return await client.any(
    `
    SELECT r.uuid, r.validation, json_agg(${aliasA}.uuid) as node_duplicate_uuids
    FROM ${SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)}.record r
      JOIN ${tableName} ${aliasA}
        ON r.uuid = ${aliasA}.${DataTable.colNameRecordUuuid} 
    WHERE
      r.cycle = $1 
      AND EXISTS (
      --exists a node entity with the same key node values in the same record (if not root entity) and in the same parent node entity
      SELECT ${aliasB}.${DataTable.colNameUuuid}
      FROM ${tableName} ${aliasB}
      WHERE
        --same cycle
        ${aliasB}.${DataTable.colNameRecordCycle} = $1
        --different node uuid 
        AND ${aliasA}.${DataTable.colNameUuuid} != ${aliasB}.${
      DataTable.colNameUuuid
    }
        ${recordAndParentEqualCondition}
        --same key node(s) values
        AND (${equalKeysCondition})
      )
    GROUP BY r.uuid, r.validation
    `,
    [cycle],
  )
}

export const fetchEntityKeysByRecordAndNodeDefUuid = async (
  survey,
  entityDefUuid,
  recordUuid,
  nodeUuid = null,
  client = db,
) => {
  const surveyId = Survey.getId(survey)
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const table = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(
    entityDef,
  )}`
  const entityDefKeys = Survey.getNodeDefKeys(entityDef)(survey)
  const keyColumns = R.pipe(
    R.map(NodeDefTable.getColName),
    R.join(', '),
  )(entityDefKeys)

  return await client.oneOrNone(
    `
    SELECT
      ${keyColumns}
    FROM
      ${table}
    WHERE
      ${DataTable.colNameRecordUuuid} = $1
      ${NodeDef.isRoot(entityDef) ? '' : `AND ${DataTable.colNameUuuid} = $2`}`,
    [recordUuid, nodeUuid],
    row => Object.values(row),
  )
}
