import * as R from 'ramda'
import * as camelize from 'camelize'
import * as pgPromise from 'pg-promise'

import { db } from '../../../../db/db'
import * as dbUtils from '../../../../db/dbUtils'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Record from '../../../../../core/record/record'
import * as Node from '../../../../../core/record/node'
import * as Expression from '../../../../../core/expressionParser/expression'

import * as SchemaRdb from '../../../../../common/surveyRdb/schemaRdb'
import * as NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'
import { Query, Sort } from '../../../../../common/model/query'
import { ViewDataNodeDef, TableNode, ColumnNodeDef, TableRecord, Schemata } from '../../../../../common/model/db'
import SqlSelectBuilder from '../../../../../common/model/db/sql/sqlSelectBuilder'

import * as DataCol from '../../schemaRdb/dataCol'
import * as DataTable from '../../schemaRdb/dataTable'

const _getParentNodeUuidColName = (viewDataNodeDef, nodeDef) => {
  const { survey } = viewDataNodeDef
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return ColumnNodeDef.getColName(nodeDefParent)
}

const _selectsByNodeDefType =
  ({ viewDataNodeDef, streamMode }) =>
  (nodeDefCol) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
    const { name: alias, nameFull, namesFull } = columnNodeDef

    if (streamMode) {
      if (NodeDef.isBooleanLabelYesNo(nodeDefCol)) {
        return [`CASE WHEN ${nameFull}::boolean = True THEN 'Yes' ELSE 'No' END AS ${alias}`]
      }
      if (NodeDef.isDate(nodeDefCol)) {
        return [`TO_CHAR(${nameFull}, 'YYYY-MM-DD') AS ${alias}`]
      }
      if (NodeDef.isTime(nodeDefCol)) {
        return [`TO_CHAR(${nameFull}, 'HH24:MI') AS ${alias}`]
      }
    }
    if (NodeDef.isCoordinate(nodeDefCol)) {
      return [
        `'EPSG:' || ST_SRID(${nameFull}) || ';POINT(' || ST_X(${nameFull}) || ' ' || ST_Y(${nameFull}) || ')' AS ${alias}`,
      ]
    }
    return namesFull
  }

const _prepareSelectFields = ({ queryBuilder, viewDataNodeDef, columnNodeDefs, nodeDefCols, editMode, streamMode }) => {
  if (columnNodeDefs) {
    queryBuilder.select(
      viewDataNodeDef.columnRecordUuid,
      ...viewDataNodeDef.columnNodeDefs.flatMap((columnNodeDef) =>
        _selectsByNodeDefType({ viewDataNodeDef, streamMode })(columnNodeDef.nodeDef)
      )
    )
    // queryBuilder.select(viewDataNodeDef.columnRecordUuid, ...viewDataNodeDef.columnNodeDefNamesRead)
  } else if (R.isEmpty(nodeDefCols)) {
    queryBuilder.select('*')
  } else {
    queryBuilder.select(
      viewDataNodeDef.columnRecordUuid,
      viewDataNodeDef.columnUuid,
      // selected node def columns
      ...nodeDefCols.flatMap(_selectsByNodeDefType({ viewDataNodeDef, streamMode })),
      // Add ancestor uuid columns
      ...viewDataNodeDef.columnUuids
    )
    if (editMode) {
      const tableRecord = new TableRecord(viewDataNodeDef.surveyId)
      queryBuilder.select(
        // Node (every node is transformed into json in a column named with the nodeDefUuid)
        ...nodeDefCols.map((nodeDefCol, idx) => `row_to_json(n${idx + 1}.*) AS "${NodeDef.getUuid(nodeDefCol)}"`),
        // Record table fields
        `row_to_json(${tableRecord.getColumn('*')}) AS record`
      )
    }
  }
}

const _prepareFromClause = ({ queryBuilder, viewDataNodeDef, nodeDefCols, editMode }) => {
  queryBuilder.from(viewDataNodeDef.nameAliased)
  if (editMode) {
    const { surveyId } = viewDataNodeDef
    const tableRecord = new TableRecord(surveyId)
    queryBuilder.from(
      // Node table; one join per column def
      ...nodeDefCols.map((nodeDefCol, idx) => {
        const nodeDefParentUuidColName = _getParentNodeUuidColName(viewDataNodeDef, nodeDefCol)
        const nodeDefUuid = NodeDef.getUuid(nodeDefCol)
        const tableNode = new TableNode(surveyId)
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
}

const _dbTransformCallbackSelect =
  ({ viewDataNodeDef, nodeDefCols, editMode }) =>
  (row) => {
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

  const queryBuilder = new SqlSelectBuilder()

  _prepareSelectFields({
    queryBuilder,
    viewDataNodeDef,
    columnNodeDefs,
    nodeDefCols,
    editMode,
    streamMode: stream,
  })

  _prepareFromClause({ queryBuilder, viewDataNodeDef, nodeDefCols, editMode })

  // WHERE clause
  if (!R.isNil(cycle)) {
    queryBuilder.where(`${viewDataNodeDef.columnRecordCycle} = $/cycle/`)
    queryBuilder.addParams({ cycle })
  }

  const filter = Query.getFilter(query)
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}
  if (!R.isNil(filterClause)) {
    queryBuilder.where(`AND ${filterClause}`)
    queryBuilder.addParams(filterParams)
  }

  // SORT clause
  const sort = Query.getSort(query)
  const { clause: sortClause, params: sortParams } = Sort.toSql(sort)
  if (!R.isEmpty(sortParams)) {
    queryBuilder.orderBy(sortClause)
    queryBuilder.addParams(sortParams)
  }
  if (!R.isNil(limit)) {
    queryBuilder.limit('$/limit/')
    queryBuilder.addParams({ limit })
  }
  if (!R.isNil(offset)) {
    queryBuilder.offset('$/offset/')
    queryBuilder.addParams({ offset })
  }

  const select = queryBuilder.build()
  const queryParams = queryBuilder.params

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

const countDuplicateRecordsByNodeDefs = async ({ survey, record, nodeDefsUnique }, client = db) => {
  const surveyId = Survey.getId(survey)
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeRoot = Record.getRootNode(record)

  const tableName = NodeDefTable.getViewName(nodeDefRoot)

  const recordNotEqualCondition = Expression.newBinary(
    Expression.newIdentifier(DataTable.colNameRecordUuuid),
    Expression.newLiteral(Record.getUuid(record)),
    Expression.operators.comparison.notEq.key
  )

  const filter = R.reduce(
    (whereExprAcc, nodeDefUnique) => {
      const nodeUnique = Record.getNodeChildByDefUuid(nodeRoot, NodeDef.getUuid(nodeDefUnique))(record)

      const identifier = Expression.newIdentifier(NodeDefTable.getColName(nodeDefUnique))
      const value = Expression.newLiteral(DataCol.getValue(survey, nodeDefUnique, nodeUnique))

      const condition = Expression.newBinary(identifier, value, Expression.operators.comparison.eq.key)

      return Expression.newBinary(whereExprAcc, condition, Expression.operators.logical.and.key)
    },
    recordNotEqualCondition,
    nodeDefsUnique
  )

  return runCount({ surveyId, cycle: Record.getCycle(record), tableName, filter }, client)
}

export const isRecordUniqueByKeys = async ({ survey, record }, client = db) => {
  const nodeDefsUnique = Survey.getNodeDefRootKeys(survey)
  const duplicateCount = await countDuplicateRecordsByNodeDefs({ survey, record, nodeDefsUnique }, client)
  return duplicateCount === 0
}

export const isRecordUniqueByUniqueNodes = async ({ survey, record }, client = db) => {
  const nodeDefsUnique = Survey.getNodeDefsRootUnique(survey)
  const duplicateCount = await countDuplicateRecordsByNodeDefs({ survey, record, nodeDefsUnique }, client)
  return duplicateCount === 0
}

export const fetchRecordsCountByRootNodesValue = async (
  survey,
  cycle,
  nodes,
  recordUuidExcluded,
  excludeRecordFromCount,
  client = db
) => {
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const nodeDefs = nodes.map((node) => Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))
  const surveyId = Survey.getId(survey)
  const schemaRdb = Schemata.getSchemaSurveyRdb(surveyId)
  const schema = Schemata.getSchemaSurvey(surveyId)
  const rootTable = `${schemaRdb}.${NodeDefTable.getViewName(nodeDefRoot)}`
  const rootTableAlias = 'r'

  const filterColumns = nodeDefs.map(NodeDefTable.getColName)
  const filterColumnsString = filterColumns.join(', ')
  const filterCondition = nodeDefs
    .map((nodeDef, idx) => {
      const node = nodes[idx]
      const value = DataCol.getValue(survey, nodeDef, node)
      return `${rootTableAlias}.${NodeDefTable.getColName(nodeDef)} ${value === null ? ' IS NULL' : `= '${value}'`}`
    })
    .join(' AND ')

  return client.map(
    `
    WITH count_records AS (
      SELECT
        ${filterColumnsString}, COUNT(*) AS count
      FROM
        ${rootTable}
      WHERE 
        ${DataTable.colNameRecordCycle} = $2
        ${excludeRecordFromCount ? ` AND ${DataTable.colNameRecordUuuid} != $1` : ''} 
      GROUP BY 
        ${filterColumnsString}
    )
    SELECT
      ${rootTableAlias}.${DataTable.colNameRecordUuuid}, jsonb_agg(n.uuid) as nodes_key_uuids, cr.count
    FROM
        ${rootTable} ${rootTableAlias}
    JOIN count_records cr
      ON ${filterColumns.map((keyCol) => `cr."${keyCol}" = ${rootTableAlias}."${keyCol}"`).join(' AND ')}
    JOIN ${schema}.node n
      ON n.record_uuid = r.record_uuid
      AND n.node_def_uuid IN (${nodeDefs.map((nodeDefKey) => `'${NodeDef.getUuid(nodeDefKey)}'`).join(', ')})
    WHERE
      ${rootTableAlias}.${DataTable.colNameRecordCycle} = $2
      AND ${filterCondition}
      AND ${rootTableAlias}.${DataTable.colNameRecordUuuid} != $1
    GROUP BY ${rootTableAlias}.${DataTable.colNameRecordUuuid}, cr.count
  `,
    [recordUuidExcluded, cycle],
    camelize
  )
}
