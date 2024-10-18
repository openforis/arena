import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { Schemata, TableDataNodeDef } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { db } from '@server/db/db'

/**
 * Returns a list of items for each record containing duplicate entities.
 * Each item is in the format:
 * ```
 * {
 *   uuid, //record uuid,
 *   validation: {}, //record validation object,
     node_duplicate_uuids: [nodeUuid1, nodeUuid2, ...] //array of duplicate entity uuids
 * }
 * ```.
 * @param {!object} survey - The survey object.
 * @param {!string} cycle - The survey cycle.
 * @param {!object} nodeDefEntity - The entity definition.
 * @param {!Array} nodeDefKeys - The key attribute defs.
 * @param {!object} client - The DB client.
 * @returns {Promise<Array>} The list of items.
 */
export const fetchRecordsWithDuplicateEntities = async (survey, cycle, nodeDefEntity, nodeDefKeys, client) => {
  const surveyId = Survey.getId(survey)

  const tableDef = new TableDataNodeDef(survey, nodeDefEntity)
  const tableName = tableDef.nameQualified

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
    : `AND ${getColEqualCondition(TableDataNodeDef.columnSet.recordUuid)}
         AND ${getColEqualCondition(TableDataNodeDef.columnSet.parentUuid)}`

  return await client.any(
    `
    SELECT r.uuid, r.validation, json_agg(${aliasA}.uuid) as node_duplicate_uuids
    FROM ${Schemata.getSchemaSurveyRdb(surveyId)}.record r
      JOIN ${tableName} ${aliasA}
        ON r.uuid = ${aliasA}.${TableDataNodeDef.columnSet.recordUuid} 
    WHERE
      r.cycle = $1 
      AND EXISTS (
      --exists a node entity with the same key node values in the same record (if not root entity) and in the same parent node entity
      SELECT ${aliasB}.${TableDataNodeDef.columnSet.uuid}
      FROM ${tableName} ${aliasB}
      WHERE
        --same cycle
        ${aliasB}.${TableDataNodeDef.columnSet.recordCycle} = $1
        --different node uuid 
        AND ${aliasA}.${TableDataNodeDef.columnSet.uuid} != ${aliasB}.${TableDataNodeDef.columnSet.uuid}
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
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const tableDef = new TableDataNodeDef(survey, entityDef)
  const entityDefKeys = Survey.getNodeDefKeys(entityDef)(survey)
  const keyColumns = R.pipe(R.map(NodeDefTable.getColumnName), R.join(', '))(entityDefKeys)
  const nodeUuidWhereCondition = NodeDef.isRoot(entityDef) ? '' : `AND ${tableDef.columnUuid} = $2`

  return await client.oneOrNone(
    `
    SELECT
      ${keyColumns}
    FROM
      ${tableDef.nameAliased}
    WHERE
      ${tableDef.columnRecordUuid} = $1
      ${nodeUuidWhereCondition}`,
    [recordUuid, nodeUuid],
    (row) => (row ? Object.values(row) : [])
  )
}
