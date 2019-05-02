const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')

const Node = require('../../../../../common/record/node')

const SchemaRdb = require('../../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')

const Expression = require('../../../../../common/exprParser/expression.js')

const DataCol = require('../schemaRdb/dataCol')

const NodeRepository = require('../../../record/persistence/nodeRepository')

const runSelect = async (surveyId, tableName, cols, offset, limit, filterExpr, filterStr, sort = '', client) => {
  const schemaName = SchemaRdb.getName(surveyId)
  // Either filterExpr or filterStr need to be passed, the other one must be null
  const { str: filterQuery, params: filterParams } = filterExpr ? Expression.getWherePerparedStatement(filterExpr) : {}
  const whereClause = filterQuery || filterStr
  const colParams = Expression.toParamsObj(cols, 'col')
  const colParamNames = Object.keys(colParams).map(n => `$/${n}:name/`)

  return await client.any(`
    SELECT ${colParamNames.join(', ')} 
    FROM $/schemaName:name/.$/tableName:name/
    ${R.isNil(whereClause) ? '' : `WHERE ${whereClause}`}
    ${R.isEmpty(sort) ? '' : `ORDER BY ${sort} NULLS LAST`}
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    OFFSET $/offset/
    `,
    { ...filterParams, ...colParams, schemaName, tableName, limit, offset }
  )
}

const runCount = async (surveyId, tableName, filterExpr, client) => {
  const schemaName = SchemaRdb.getName(surveyId)
  const { str: filterQuery, params: filterParams } = filterExpr ? Expression.getWherePerparedStatement(filterExpr) : {}

  return await client.one(`
    SELECT count(*) 
    FROM $/schemaName:name/.$/tableName:name/
    ${R.isNil(filterQuery) ? '' : `WHERE ${filterQuery}`}
  `, { ...filterParams, schemaName, tableName })
}

const queryRootTableByRecordKeys = async (survey, recordUuid, client) => {
  const surveyId = Survey.getId(survey)
  const rootDef = Survey.getRootNodeDef(survey)
  const keyDefs = Survey.getNodeDefKeys(rootDef)(survey)

  const rootNode = await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, recordUuid, null, NodeDef.getUuid(rootDef), client)

  // 1. find record key nodes
  const keyNodes = await Promise.all(
    keyDefs.map(
      async keyDef =>
        await NodeRepository.fetchChildNodeByNodeDefUuid(surveyId, recordUuid, Node.getUuid(rootNode), NodeDef.getUuid(keyDef), client)
    )
  )
  const tableName = NodeDefTable.getViewName(rootDef)
  const getColName = R.pipe(
    Node.getNodeDefUuid,
    nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
    NodeDefTable.getColNames,
    R.head
  )
  const getColValue = async (node, client) => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const values = await DataCol.getValues(Survey.getSurveyInfo(survey), nodeDef, node, client)
    return R.head(values)
  }

  const whereConditions = await Promise.all(
    keyNodes.map(
      async node => {
        const colValue = await getColValue(node)
        return `${getColName(node)} ${colValue === null ? ' IS NULL' : ' = \'' + colValue + '\''}`
      }
    )
  )

  return await runSelect(surveyId, tableName, ['*'], 0, null, null, whereConditions, '', client)
}

module.exports = {
  runSelect,
  runCount,
  queryRootTableByRecordKeys,
}