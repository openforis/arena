import * as R from 'ramda'
import * as camelize from 'camelize'
import * as pgPromise from 'pg-promise'

import { db } from '../../../../db/db'
import * as dbUtils from '../../../../db/dbUtils'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Record from '../../../../../core/record/record'
import * as Expression from '../../../../../core/expressionParser/expression'

import * as SchemaRdb from '../../../../../common/surveyRdb/schemaRdb'
import * as NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'

import * as DataSort from '../../../../../common/surveyRdb/dataSort'
import * as DataFilter from '../../../../../common/surveyRdb/dataFilter'
import { ViewDataNodeDef } from '../../../../../common/model/db'
import { getSurveyDBSchema } from '../../../survey/repository/surveySchemaRepositoryUtils'

import * as DataCol from '../../schemaRdb/dataCol'
import * as DataTable from '../../schemaRdb/dataTable'

export const runSelect = async (
  surveyId,
  cycle,
  tableName,
  cols,
  offset,
  limit,
  filterExpr,
  sort = [],
  queryStream = false,
  client = db
) => {
  const schemaName = SchemaRdb.getName(surveyId)
  // Columns
  const colParams = cols.reduce((params, col, i) => ({ ...params, [`col_${i}`]: col }), {})
  const colParamNames = Object.keys(colParams).map((n) => `$/${n}:name/`)
  // WHERE clause
  const { clause: filterClause, params: filterParams } = filterExpr
    ? DataFilter.getWherePreparedStatement(filterExpr)
    : {}
  // SORT clause
  const { clause: sortClause, params: sortParams } = DataSort.getSortPreparedStatement(sort)

  const select = `
    SELECT 
        ${colParamNames.join(', ')}
    FROM 
        $/schemaName:name/.$/tableName:name/
    WHERE 
      ${DataTable.colNameRecordCycle} = $/cycle/
      ${R.isNil(filterClause) ? '' : `AND ${filterClause}`}
    ORDER BY 
        ${R.isEmpty(sortParams) ? '' : `${sortClause}, `}date_modified DESC NULLS LAST
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    OFFSET $/offset/`

  const params = {
    cycle,
    ...filterParams,
    ...colParams,
    ...sortParams,
    schemaName,
    tableName,
    limit,
    offset,
  }

  return queryStream ? new dbUtils.QueryStream(dbUtils.formatQuery(select, params)) : client.any(select, params)
}

export const runCount = async (surveyId, cycle, tableName, filterExpr, client = db) => {
  const schemaName = SchemaRdb.getName(surveyId)
  const { clause: filterClause, params: filterParams } = filterExpr
    ? DataFilter.getWherePreparedStatement(filterExpr)
    : {}

  const countRS = await client.one(
    `
    SELECT 
        count(*)
    FROM 
        $/schemaName:name/.$/tableName:name/
    WHERE 
      ${DataTable.colNameRecordCycle} = $/cycle/
      ${R.isNil(filterClause) ? '' : ` AND ${filterClause}`}
    `,
    {
      cycle,
      ...filterParams,
      schemaName,
      tableName,
    }
  )

  return Number(countRS.count)
}

export const countDuplicateRecords = async (survey, record, client = db) => {
  const surveyId = Survey.getId(survey)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
  const nodeRoot = Record.getRootNode(record)

  const tableName = NodeDefTable.getViewName(nodeDefRoot)

  const recordNotEqualCondition = Expression.newBinary(
    Expression.newIdentifier(DataTable.colNameRecordUuuid),
    Expression.newLiteral(Record.getUuid(record)),
    Expression.operators.comparison.notEq.key
  )

  const whereExpr = R.reduce(
    (whereExprAcc, nodeDefKey) => {
      const nodeKey = Record.getNodeChildByDefUuid(nodeRoot, NodeDef.getUuid(nodeDefKey))(record)

      const identifier = Expression.newIdentifier(NodeDefTable.getColName(nodeDefKey))
      const value = Expression.newLiteral(DataCol.getValue(survey, nodeDefKey, nodeKey))

      const condition = Expression.newBinary(identifier, value, Expression.operators.comparison.eq.key)

      return Expression.newBinary(whereExprAcc, condition, Expression.operators.logical.and.key)
    },
    recordNotEqualCondition,
    nodeDefKeys
  )

  return runCount(surveyId, Record.getCycle(record), tableName, whereExpr, client)
}

export const fetchRecordsCountByKeys = async (
  survey,
  cycle,
  keyNodes,
  recordUuidExcluded,
  excludeRecordFromCount,
  client = db
) => {
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
  const surveyId = Survey.getId(survey)
  const schemaRdb = SchemaRdb.getName(surveyId)
  const schema = getSurveyDBSchema(surveyId)
  const rootTable = `${schemaRdb}.${NodeDefTable.getViewName(nodeDefRoot)}`
  const rootTableAlias = 'r'

  const keyColumns = nodeDefKeys.map(NodeDefTable.getColName)
  const keyColumnsString = keyColumns.join(', ')
  const keysCondition = R.pipe(
    R.addIndex(R.map)((nodeDefKey, idx) => {
      const value = DataCol.getValue(survey, nodeDefKey, keyNodes[idx])
      return `${rootTableAlias}.${NodeDefTable.getColName(nodeDefKey)} ${value === null ? ' IS NULL' : `= '${value}'`}`
    }),
    R.join(' AND ')
  )(nodeDefKeys)

  return client.map(
    `
    WITH count_records AS (
      SELECT
        ${keyColumnsString}, COUNT(*) AS count
      FROM
        ${rootTable}
      WHERE 
        ${DataTable.colNameRecordCycle} = $2
        ${excludeRecordFromCount ? ` AND ${DataTable.colNameRecordUuuid} != $1` : ''} 
      GROUP BY 
        ${keyColumnsString}
    )
    SELECT
      ${rootTableAlias}.${DataTable.colNameRecordUuuid}, jsonb_agg(n.uuid) as nodes_key_uuids, cr.count
    FROM
        ${rootTable} ${rootTableAlias}
    JOIN count_records cr
      ON ${keyColumns.map((keyCol) => `cr."${keyCol}" = ${rootTableAlias}."${keyCol}"`).join(' AND ')}
    JOIN ${schema}.node n
      ON n.record_uuid = r.record_uuid
      AND n.node_def_uuid IN (${nodeDefKeys.map((nodeDefKey) => `'${NodeDef.getUuid(nodeDefKey)}'`).join(', ')})
    WHERE
      ${rootTableAlias}.${DataTable.colNameRecordCycle} = $2
      AND ${keysCondition}
      AND ${rootTableAlias}.${DataTable.colNameRecordUuuid} != $1
    GROUP BY ${rootTableAlias}.${DataTable.colNameRecordUuuid}, cr.count
    `,
    [recordUuidExcluded, cycle],
    camelize
  )
}

/**
 * Fetches all the rows of the specified nodeDef view.
 *
 * @param {!object} params - The filter parameters.
 * @param {!Survey} params.survey - The survey.
 * @param {!string} params.cycle - The survey cycle.
 * @param {!NodeDef} params.nodeDef - The nodeDef.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchViewData = async (params, client = db) => {
  const { survey, cycle, nodeDef, columnNodeDefs = false } = params
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  const columns = columnNodeDefs ? viewDataNodeDef.columnNodeDefNamesRead : ['*']

  return client.any(
    `SELECT ${columns.join(', ')} 
    FROM ${viewDataNodeDef.nameFull}
    WHERE ${ViewDataNodeDef.columnSet.recordCycle} = $1`,
    [cycle]
  )
}
