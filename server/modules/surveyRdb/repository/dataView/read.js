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
import { Query, Sort } from '../../../../../common/model/query'
import { ViewDataNodeDef, TableNode, TableResultNode, ColumnNodeDef, TableRecord } from '../../../../../common/model/db'
import { getSurveyDBSchema } from '../../../survey/repository/surveySchemaRepositoryUtils'

import * as DataCol from '../../schemaRdb/dataCol'
import * as DataTable from '../../schemaRdb/dataTable'

const _getParentNodeUuidColName = (viewDataNodeDef, nodeDef) => {
  const { survey } = viewDataNodeDef
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return ColumnNodeDef.getColName(nodeDefParent)
}

const _isBooleanAndHasLabels = ({ nodeDef }) =>
  NodeDef.isBoolean(nodeDef) && NodeDef.getLabelValueType(nodeDef) === NodeDef.booleanLabelValueTypes.yesNo

const _getSelectFields = ({ viewDataNodeDef, columnNodeDefs, nodeDefCols, editMode, streamMode }) => {
  if (columnNodeDefs) {
    return [viewDataNodeDef.columnRecordUuid, ...viewDataNodeDef.columnNodeDefNamesRead].join(', ')
  }

  if (!R.isEmpty(nodeDefCols)) {
    const selectFields = [
      viewDataNodeDef.columnRecordUuid,
      viewDataNodeDef.columnUuid,
      // selected node def columns
      ...nodeDefCols
        .map((nodeDefCol) => {
          const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)

          if (streamMode && _isBooleanAndHasLabels({ nodeDef: columnNodeDef.nodeDef })) {
            return `CASE WHEN ${columnNodeDef.namesFull}::boolean = True THEN 'Yes' ELSE 'No' END as ${columnNodeDef.name}`
          }

          return columnNodeDef.namesFull
        })
        .flat(),
      // Add ancestor uuid columns
      ...viewDataNodeDef.columnUuids,
    ]
    if (editMode) {
      const tableRecord = new TableRecord(viewDataNodeDef.surveyId)
      selectFields.push(
        // Node (every node is transformed into json in a column named with the nodeDefUuid)
        ...nodeDefCols.map((nodeDefCol, idx) => `row_to_json(n${idx + 1}.*) AS "${NodeDef.getUuid(nodeDefCol)}"`),
        // Record table fields
        `row_to_json(${tableRecord.getColumn('*')}) AS record`
      )
    }
    return selectFields.join(', ')
  }

  return '*'
}

const _getFromClause = ({ viewDataNodeDef, nodeDefCols, editMode }) => {
  const fromTables = [viewDataNodeDef.nameAliased]
  if (editMode) {
    const { surveyId } = viewDataNodeDef
    const tableRecord = new TableRecord(surveyId)
    fromTables.push(
      // Node table; one join per column def
      ...nodeDefCols.map((nodeDefCol, idx) => {
        const nodeDefParentUuidColName = _getParentNodeUuidColName(viewDataNodeDef, nodeDefCol)
        const nodeDefUuid = NodeDef.getUuid(nodeDefCol)
        const tableNode = NodeDef.isAnalysis(nodeDefCol) ? new TableResultNode(surveyId) : new TableNode(surveyId)
        tableNode.alias = `n${idx + 1}`

        return `LEFT JOIN LATERAL ( 
          ${tableNode.getSelect({ parentUuid: `${viewDataNodeDef.alias}.${nodeDefParentUuidColName}`, nodeDefUuid })}
        ) AS ${tableNode.alias} ON TRUE`
      }),
      // Record table
      `LEFT JOIN ${tableRecord.nameAliased} 
        ON ${tableRecord.columnUuid} = ${viewDataNodeDef.columnRecordUuid}
      `
    )
  }
  return fromTables.join(' ')
}

const _dbTransformCallbackSelect = ({ viewDataNodeDef, nodeDefCols, editMode }) => (row) => {
  if (!editMode) {
    return row
  }
  const rowUpdated = { ...row }
  // Node columns (one column for each selected node def)
  rowUpdated.cols = {}
  nodeDefCols.forEach((nodeDefCol) => {
    const nodeDefColUuid = NodeDef.getUuid(nodeDefCol)
    const nodeJson = rowUpdated[nodeDefColUuid]
    const nodeDefParentColumnUuid = _getParentNodeUuidColName(viewDataNodeDef, nodeDefCol)
    const parentUuid = rowUpdated[nodeDefParentColumnUuid]
    rowUpdated.cols[nodeDefColUuid] = {
      node: TableNode.dbTransformCallback(nodeJson),
      parentUuid,
    }
    delete rowUpdated[nodeDefColUuid]
  })
  // Record column
  rowUpdated.record = TableRecord.transformCallback(viewDataNodeDef.surveyId)(rowUpdated.record)
  // Parent node uuid column
  const nodeDefParentColumnUuid = _getParentNodeUuidColName(viewDataNodeDef, viewDataNodeDef.nodeDef)
  rowUpdated.parentUuid = rowUpdated[nodeDefParentColumnUuid]

  return rowUpdated
}

/**
 * Runs a select query on a data view associated to an entity node definition.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.stream=false] - Whether to fetch rows to be streamed.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params, client = db) => {
  const { survey, cycle, query, columnNodeDefs, offset = null, limit = null, stream = false } = params

  const editMode = Query.isModeRawEdit(query)
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const nodeDefCols = Survey.getNodeDefsByUuids(Query.getAttributeDefUuids(query))(survey)

  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)

  const selectFields = _getSelectFields({ viewDataNodeDef, columnNodeDefs, nodeDefCols, editMode, streamMode: stream })

  const fromClause = _getFromClause({ viewDataNodeDef, nodeDefCols, editMode })

  // WHERE clause
  const filter = Query.getFilter(query)
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}

  // SORT clause
  const sort = Query.getSort(query)
  const { clause: sortClause, params: sortParams } = Sort.toSql(sort)

  const select = `
    SELECT 
        ${selectFields}
    FROM 
        ${fromClause}
    WHERE 
      ${viewDataNodeDef.columnRecordCycle} = $/cycle/
      ${R.isNil(filterClause) ? '' : `AND ${filterClause}`}
    ORDER BY 
        ${R.isEmpty(sortParams) ? '' : `${sortClause}, `}${viewDataNodeDef.columnDateModified} DESC NULLS LAST
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    ${R.isNil(offset) ? '' : 'OFFSET $/offset/'}
  `

  const queryParams = {
    cycle,
    ...filterParams,
    ...sortParams,
    limit,
    offset,
  }

  return stream
    ? new dbUtils.QueryStream(dbUtils.formatQuery(select, queryParams))
    : client.map(select, queryParams, _dbTransformCallbackSelect({ viewDataNodeDef, nodeDefCols, editMode }))
}

export const runCount = async ({ surveyId, cycle, tableName, filter }, client = db) => {
  const schemaName = SchemaRdb.getName(surveyId)
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}

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

  const filter = R.reduce(
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

  return runCount({ surveyId, cycle: Record.getCycle(record), tableName, filter }, client)
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
