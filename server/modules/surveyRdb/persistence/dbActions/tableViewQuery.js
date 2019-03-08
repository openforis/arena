const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')

const Node = require('../../../../../common/record/node')

const SchemaRdb = require('../../../../../common/surveyRdb/schemaRdb')
const NodeDefTable = require('../../../../../common/surveyRdb/nodeDefTable')

const DataCol = require('../schemaRdb/dataCol')

const NodeRepository = require('../../../record/persistence/nodeRepository')

const runSelect = async (surveyId, tableName, cols, offset, limit, filter = '', sort = '', client) => {
  const schemaName = SchemaRdb.getName(surveyId)

  return await client.any(`
    SELECT ${cols.join(', ')} 
    FROM ${schemaName}.${tableName}
    ${R.isEmpty(filter) ? '' : `WHERE ${filter}`}
    ${R.isEmpty(sort) ? '' : `ORDER BY ${sort} NULLS LAST`}
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    []
  )
}

const runCount = async (surveyId, tableName, filter = '', client) => {
  const schemaName = SchemaRdb.getName(surveyId)

  return await client.one(`
    SELECT count(*) 
    FROM ${schemaName}.${tableName}
    ${R.isEmpty(filter) ? '' : `WHERE ${filter}`}
  `)
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
  const getColValue = async node => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const values = await DataCol.getValues(Survey.getSurveyInfo(survey), nodeDef, node)
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

  return await runSelect(surveyId, tableName, ['*'], 0, 'ALL', whereConditions.join(' AND '), '', client)

}

module.exports = {
  runSelect,
  runCount,
  queryRootTableByRecordKeys,
}