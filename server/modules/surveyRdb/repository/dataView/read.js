import * as R from 'ramda'
import * as camelize from 'camelize'
import * as pgPromise from 'pg-promise'

import { Objects } from '@openforis/arena-core'

import { quote } from '@core/stringUtils'

import { db } from '../../../../db/db'
import * as DbUtils from '../../../../db/dbUtils'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Record from '../../../../../core/record/record'
import * as Expression from '../../../../../core/expressionParser/expression'

import * as SchemaRdb from '../../../../../common/surveyRdb/schemaRdb'
import * as NodeDefTable from '../../../../../common/surveyRdb/nodeDefTable'
import { Query, Sort } from '../../../../../common/model/query'
import {
  ViewDataNodeDef,
  TableNode,
  ColumnNodeDef,
  TableRecord,
  Schemata,
  TableDataNodeDef,
} from '../../../../../common/model/db'
import SqlSelectBuilder from '../../../../../common/model/db/sql/sqlSelectBuilder'

import { TableDataNodeDefColUtils } from '@common/model/db/tables/dataNodeDef/colUtils'

const _getAncestorMultipleEntityUuidColumnName = (viewDataNodeDef, nodeDef) => {
  const { survey } = viewDataNodeDef
  const ancestorMultipleEntityDef = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  return ColumnNodeDef.getColumnName(ancestorMultipleEntityDef)
}

const columnTransformByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ streamMode, nameFull, namesFull, alias }) => {
    if (!streamMode) {
      // boolean value, not text
      return [`${nameFull}::boolean AS ${alias}`]
    }
    // transform not applied
    return namesFull
  },
  [NodeDef.nodeDefType.coordinate]: ({ viewAlias, names, nameFull, alias, streamMode }) => {
    const result = names
      .filter((colName) => colName !== alias || !streamMode) // include default column only when not in reading stream mode (e.g. in data explorer)
      .map((colName) => {
        if (colName === alias) {
          // not in stream mode: read default column as a geometry point string
          return DbUtils.geometryPointColumnAsText({ qualifiedColName: nameFull, alias })
        }
        return `${viewAlias}.${colName} AS ${colName}`
      })
    return result
  },
  [NodeDef.nodeDefType.date]: ({ nameFull, alias }) => [`TO_CHAR(${nameFull}, 'YYYY-MM-DD') AS ${alias}`],
  [NodeDef.nodeDefType.time]: ({ nameFull, alias }) => [`TO_CHAR(${nameFull}, 'HH24:MI') AS ${alias}`],
}

const _selectFieldsByNodeDefType =
  ({ viewDataNodeDef, streamMode }) =>
  (nodeDefCol) => {
    const columnNodeDef = new ColumnNodeDef(viewDataNodeDef, nodeDefCol)
    const { name: alias, names, nameFull, namesFull } = columnNodeDef

    const columnTransform = columnTransformByNodeDefType[NodeDef.getType(nodeDefCol)]
    if (columnTransform) {
      return columnTransform({ streamMode, viewAlias: viewDataNodeDef.alias, nameFull, namesFull, names, alias })
    }
    return namesFull
  }

const _prepareSelectFields = ({
  queryBuilder,
  viewDataNodeDef,
  columnNodeDefs,
  nodeDefCols,
  editMode,
  streamMode,
  includeFileAttributeDefs = true,
  includeDateCreated = false,
}) => {
  const alwaysIncludedFields = [
    viewDataNodeDef.columnRecordUuid,
    viewDataNodeDef.columnRecordOwnerUuid,
    `${viewDataNodeDef.columnRecordCycle}::integer + 1 AS ${ViewDataNodeDef.columnSet.recordCycle}`,
  ]
  if (columnNodeDefs) {
    queryBuilder.select(
      ...alwaysIncludedFields,
      ...viewDataNodeDef.columnNodeDefs
        .filter((columnNodeDef) => includeFileAttributeDefs || !NodeDef.isFile(columnNodeDef.nodeDef))
        .flatMap((columnNodeDef) => _selectFieldsByNodeDefType({ viewDataNodeDef, streamMode })(columnNodeDef.nodeDef))
    )
  } else if (R.isEmpty(nodeDefCols)) {
    queryBuilder.select('*')
  } else {
    queryBuilder.select(
      ...alwaysIncludedFields,
      viewDataNodeDef.columnUuid,
      // selected node def columns
      ...nodeDefCols.flatMap(_selectFieldsByNodeDefType({ viewDataNodeDef, streamMode })),
      // Add ancestor uuid columns
      ...viewDataNodeDef.columnUuids
    )
    if (includeDateCreated) {
      queryBuilder.select(viewDataNodeDef.columnDateCreated)
    }
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
    const { survey, surveyId } = viewDataNodeDef
    const tableRecord = new TableRecord(surveyId)
    queryBuilder.from(
      // Node table; one join per column def
      ...nodeDefCols.map((nodeDefCol, idx) => {
        const ancestorMultipleEntityUuidColumnName = _getAncestorMultipleEntityUuidColumnName(
          viewDataNodeDef,
          nodeDefCol
        )
        const nodeDefUuid = NodeDef.getUuid(nodeDefCol)
        const tableNode = new TableNode(survey)
        tableNode.alias = `n${idx + 1}`

        return `LEFT JOIN LATERAL ( 
          ${tableNode.getSelect({
            parentUuid: `${viewDataNodeDef.alias}.${ancestorMultipleEntityUuidColumnName}`,
            nodeDefUuid,
          })}
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
      const nodeDefParentColumnUuid = _getAncestorMultipleEntityUuidColumnName(viewDataNodeDef, nodeDefCol)
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
    const nodeDefParentColumnUuid = _getAncestorMultipleEntityUuidColumnName(viewDataNodeDef, viewDataNodeDef.nodeDef)
    rowUpdated.parentUuid = rowUpdated[nodeDefParentColumnUuid]

    return rowUpdated
  }

const _createViewDataQuery = (params) => {
  const {
    survey,
    cycle,
    query,
    columnNodeDefs,
    includeFileAttributeDefs = true,
    includeDateCreated = false,
    recordSteps,
    recordOwnerUuid = null,
    offset = null,
    limit = null,
    stream = false,
  } = params

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
    includeFileAttributeDefs,
    includeDateCreated,
  })

  _prepareFromClause({ queryBuilder, viewDataNodeDef, nodeDefCols, editMode })

  // WHERE clause
  if (!R.isNil(cycle)) {
    queryBuilder.where(`${viewDataNodeDef.columnRecordCycle} = $/cycle/`)
    queryBuilder.addParams({ cycle })

    const recordUuid = Query.getFilterRecordUuid(query)
    if (recordUuid) {
      queryBuilder.where(`${viewDataNodeDef.columnRecordUuid} = $/recordUuid/`)
      queryBuilder.addParams({ recordUuid })
    }
    const recordUuids = Query.getFilterRecordUuids(query)
    if (recordUuids?.length > 0) {
      queryBuilder.where(`${viewDataNodeDef.columnRecordUuid} IN ($/recordUuids:csv/)`)
      queryBuilder.addParams({ recordUuids })
    }
  }

  if (!Objects.isEmpty(recordSteps)) {
    queryBuilder.where(`${viewDataNodeDef.columnRecordStep} IN ($/recordSteps:csv/)`)
    queryBuilder.addParams({ recordSteps })
  }

  if (!Objects.isEmpty(recordOwnerUuid)) {
    queryBuilder.where(`${viewDataNodeDef.columnRecordOwnerUuid} = $/recordOwnerUuid/`)
    queryBuilder.addParams({ recordOwnerUuid })
  }

  const filter = Query.getFilter(query)
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}
  if (!R.isNil(filterClause)) {
    queryBuilder.where(filterClause)
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

  const { selectFields } = queryBuilder
  const select = queryBuilder.build()
  const queryParams = queryBuilder.params

  return { select, selectFields, queryParams }
}

/**
 * Runs a select query on a data view associated to an entity node definition.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {boolean} [params.includeFileAttributeDefs=true] - Whether to include file attribute column node defs.
 * @param {Array} [params.recordSteps] - The record steps used to filter data. If null or empty, data in all steps will be fetched.
 * @param {string} [params.recordOwnerUuid] - The record owner UUID. If null, data from all records will be fetched, otherwise only the ones owned by the specified user.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.stream=false] - Whether to fetch rows to be streamed.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params, client = db) => {
  const { survey, query, stream = false } = params

  const editMode = Query.isModeRawEdit(query)
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const nodeDefCols = Survey.getNodeDefsByUuids(Query.getAttributeDefUuids(query))(survey)

  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)

  const { select, queryParams } = _createViewDataQuery(params)

  return stream
    ? new DbUtils.QueryStream(DbUtils.formatQuery(select, queryParams))
    : client.map(select, queryParams, _dbTransformCallbackSelect({ viewDataNodeDef, nodeDefCols, editMode }))
}

export const countViewData = async (params, client = db) => {
  const { select, selectFields, queryParams } = _createViewDataQuery(params)
  const query = DbUtils.formatQuery(select, queryParams)
  const countQuery = `SELECT COUNT(*) AS count FROM (${query}) AS count_query`
  const countResult = await client.one(countQuery)
  return { selectFields, count: Number(countResult.count) }
}

export const countDataTableRows = async (
  { surveyId, cycle, tableName, filter = null, recordOwnerUuid = null },
  client = db
) => {
  const schemaName = SchemaRdb.getName(surveyId)
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}

  const countRS = await client.one(
    `
    SELECT 
        count(*)
    FROM 
        $/schemaName:name/.$/tableName:name/
    WHERE 
      ${TableDataNodeDef.columnSet.recordCycle} = $/cycle/
      ${recordOwnerUuid ? ` AND ${TableDataNodeDef.columnSet.recordOwnerUuid} = $/recordOwnerUuid/` : ''}
      ${R.isNil(filterClause) ? '' : ` AND ${filterClause}`}
    `,
    {
      ...filterParams,
      cycle,
      recordOwnerUuid,
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

  const recordNotEqualCondition = Expression.newBinary({
    left: Expression.newIdentifier(TableDataNodeDef.columnSet.recordUuid),
    right: Expression.newLiteral(Record.getUuid(record)),
    operator: Expression.operators.comparison.notEq.value,
  })

  const filter = R.reduce(
    (whereExprAcc, nodeDefUnique) => {
      const nodeUnique = Record.getNodeChildByDefUuid(nodeRoot, NodeDef.getUuid(nodeDefUnique))(record)

      const identifier = Expression.newIdentifier(NodeDefTable.getColumnName(nodeDefUnique))
      const colValue = TableDataNodeDefColUtils.getValue(survey, nodeDefUnique, nodeUnique)
      const colValueString = R.isNil(colValue) ? null : String(colValue)
      const value = Expression.newLiteral(colValueString)

      const condition = Expression.newBinary({
        left: identifier,
        right: value,
        operator: Expression.operators.comparison.eq.value,
      })

      return Expression.newBinary({
        left: whereExprAcc,
        right: condition,
        operator: Expression.operators.logical.and.value,
      })
    },
    recordNotEqualCondition,
    nodeDefsUnique
  )

  return countDataTableRows({ surveyId, cycle: Record.getCycle(record), tableName, filter }, client)
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
  { survey, cycle, nodeDefs, nodes, recordUuidsExcluded = [], excludeRecordsFromCount = false },
  client = db
) => {
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const surveyId = Survey.getId(survey)
  const schemaRdb = Schemata.getSchemaSurveyRdb(surveyId)
  const schema = Schemata.getSchemaSurvey(surveyId)
  const rootTable = `${schemaRdb}.${NodeDefTable.getViewName(nodeDefRoot)}`
  const rootTableAlias = 'r'

  const nodeValues = nodeDefs.map((nodeDef, idx) => {
    const value = TableDataNodeDefColUtils.getValue(survey, nodeDef, nodes[idx])
    return Objects.isNil(value) ? null : String(value)
  })

  const filterColumns = nodeDefs.map(NodeDefTable.getColumnName)
  const filterColumnsString = filterColumns.join(', ')

  const filterCondition = nodeDefs
    .map((nodeDef, idx) => {
      const value = nodeValues[idx]
      const fullColumnName = `${rootTableAlias}.${NodeDefTable.getColumnName(nodeDef)}`
      if (Objects.isNil(value)) {
        return `${fullColumnName} IS NULL`
      }
      if (NodeDef.isCoordinate(nodeDef)) {
        return `${fullColumnName} = ST_GeomFromEWKT($/attr_${idx}/)`
      }
      return `${fullColumnName}::text = $/attr_${idx}/`
    })
    .join(' AND ')

  const filterQueryParams = nodeDefs.reduce((acc, _nodeDef, idx) => {
    acc[`attr_${idx}`] = nodeValues[idx]
    return acc
  }, {})

  const rootTableRecordUuidAliasedCol = `${rootTableAlias}.${TableDataNodeDef.columnSet.recordUuid}`

  return client.map(
    `
    WITH count_records AS (
      SELECT
        ${filterColumnsString}, COUNT(*) AS count
      FROM
        ${rootTable}
      WHERE 
        ${TableDataNodeDef.columnSet.recordCycle} = $/cycle/
        ${excludeRecordsFromCount ? ` AND ${TableDataNodeDef.columnSet.recordUuid} NOT IN ($/recordUuidsExcluded:csv/)` : ''}
      GROUP BY 
        ${filterColumnsString}
    )
    SELECT
      ${rootTableRecordUuidAliasedCol}, jsonb_agg(n.uuid) as nodes_key_uuids, cr.count
    FROM
        ${rootTable} ${rootTableAlias}
    JOIN count_records cr
      ON ${filterColumns.map((keyCol) => `cr."${keyCol}" = ${rootTableAlias}."${keyCol}"`).join(' AND ')}
    JOIN ${schema}.node n
      ON n.record_uuid = r.record_uuid
      AND n.node_def_uuid IN (${nodeDefs.map((nodeDefKey) => quote(NodeDef.getUuid(nodeDefKey))).join(', ')})
    WHERE
      ${rootTableAlias}.${TableDataNodeDef.columnSet.recordCycle} = $/cycle/
      AND ${filterCondition}
      AND ${rootTableRecordUuidAliasedCol} NOT IN ($/recordUuidsExcluded:csv/)
    GROUP BY ${rootTableRecordUuidAliasedCol}, cr.count
  `,
    {
      recordUuidsExcluded,
      cycle,
      ...filterQueryParams,
    },
    camelize
  )
}
