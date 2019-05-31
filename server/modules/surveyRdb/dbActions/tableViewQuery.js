const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')

const Record = require('../../../../common/record/record')

const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const Expression = require('../../../../common/exprParser/expression.js')
const DataSort = require('../../../../common/surveyRdb/dataSort')
const DataFilter = require('../../../../common/surveyRdb/dataFilter')

const DataCol = require('../schemaRdb/dataCol')
const DataTable = require('../schemaRdb/dataTable')

const runSelect = async (surveyId, tableName, cols, offset, limit, filterExpr, sort, client) => {
  const schemaName = SchemaRdb.getName(surveyId)

  // columns
  const colParams = cols.reduce((params, col, i) => ({ ...params, [`col_${i}`]: col }), {})
  const colParamNames = Object.keys(colParams).map(n => `$/${n}:name/`)

  // WHERE clause
  const { clause: filterClause, params: filterParams } = filterExpr ? DataFilter.getWherePreparedStatement(filterExpr) : {}

  // SORT clause
  const { clause: sortClause, params: sortParams } = DataSort.getSortPreparedStatement(sort)

  return await client.any(`
    SELECT 
        ${colParamNames.join(', ')}
    FROM 
        $/schemaName:name/.$/tableName:name/
    ${R.isNil(filterClause) ? '' : `WHERE ${filterClause}`}
    ORDER BY 
        ${R.isEmpty(sortParams) ? '' : `${sortClause}, `}date_modified DESC NULLS LAST
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    OFFSET $/offset/`,
    { ...filterParams, ...colParams, ...sortParams, schemaName, tableName, limit, offset }
  )
}

const runCount = async (surveyId, tableName, filterExpr, client) => {
  const schemaName = SchemaRdb.getName(surveyId)
  const { clause: filterClause, params: filterParams } = filterExpr ? DataFilter.getWherePreparedStatement(filterExpr) : {}

  const countRS = await client.one(`
    SELECT 
        count(*)
    FROM 
        $/schemaName:name/.$/tableName:name/
    ${R.isNil(filterClause) ? '' : `WHERE ${filterClause}`}
    `,
    { ...filterParams, schemaName, tableName }
  )

  return Number(countRS.count)
}

const countDuplicateRecords = async (survey, record, client) => {
  const surveyId = Survey.getId(survey)
  const nodeDefRoot = Survey.getRootNodeDef(survey)
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

  return await runCount(surveyId, tableName, whereExpr, client)
}

const fetchRecordsCountByKeys = async (survey, client) => {
  const rootEntityTableAlias = 'n0'
  const nodeDefRoot = Survey.getRootNodeDef(survey)
  const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
  const keysCol = `CONCAT(${nodeDefKeys.map(nodeDefKey => `${rootEntityTableAlias}.${NodeDefTable.getColName(nodeDefKey)}`).join('____')})`

  return await client.any(`
    SELECT ${keysCol}, COUNT(*)
    FROM ${SchemaRdb.getName(Survey.getId(survey))}.${NodeDefTable.getViewName(nodeDefRoot)} as ${rootEntityTableAlias}
  `)

}

const fetchDuplicateNodeEntities = async (survey, nodeDefEntity, nodeDefKeys, client) => {

  const tableName = `${SchemaRdb.getName(Survey.getId(survey))}.${NodeDefTable.getTableName(nodeDefEntity)}`

  const aliasA = 'e1'
  const aliasB = 'e2'

  const equalKeysCondition = R.pipe(
    R.map(nodeDefKey => `${aliasA}.${NodeDefTable.getColName(nodeDefKey)} = ${aliasB}.${NodeDefTable.getColName(nodeDefKey)}`),
    R.join(' AND '),
  )(nodeDefKeys)

  const rows = client.any(`
    SELECT ${aliasA}.${DataTable.colNameRecordUuuid}, ${aliasA}.${DataTable.colNameMeta}
    FROM ${tableName} ${aliasA}
    WHERE EXISTS (
      SELECT ${aliasB}.${DataTable.colNameUuuid}
      FROM ${tableName} ${aliasB}
        WHERE ${aliasA}.${DataTable.colNameUuuid} != ${aliasB}.${DataTable.colNameUuuid}
        AND ${aliasA}.${DataTable.colNameRecordUuuid} = ${aliasB}.${DataTable.colNameRecordUuuid}
        AND ${aliasA}.${DataTable.colNameParentUuuid} = ${aliasB}.${DataTable.colNameParentUuuid}
        AND (${equalKeysCondition})
      )
  `)

  return rows
}

module.exports = {
  runSelect,
  runCount,

  countDuplicateRecords,
  fetchRecordsCountByKeys,
  fetchDuplicateNodeEntities
}