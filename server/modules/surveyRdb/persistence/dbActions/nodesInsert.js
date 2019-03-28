const R = require('ramda')
const Promise = require('bluebird')

const { insertAllQuery } = require('../../../../db/dbUtils')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const SchemaRdb = require('../../../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')

const flatten = array => {
  const result = []
  array.forEach(arr =>
    arr.forEach(item =>
      result.push(item)
    )
  )
  return result
}

const getNodesRowValues = async (survey, nodeDef, record, client) => {
  const nodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDef))(record)

  return R.isEmpty(nodes)
    ? []
    : await Promise.all(
      nodes.map(
        async node =>
          await DataTable.getRowValues(survey, nodeDef, record, node, client)
      )
    )
}

const run = async (survey, nodeDef, records, client) => {
  const insertValuesArray = await Promise.all(
    records.map(
      async record =>
        await getNodesRowValues(survey, nodeDef, record, client)
    )
  )

  const insertValues = flatten(insertValuesArray)

  if (insertValues.length > 0) {
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

    const schema = SchemaRdb.getName(Survey.getId(survey))
    const table = DataTable.getName(nodeDef, nodeDefParent)

    await client.none(insertAllQuery(
      schema,
      table,
      DataTable.getColumnNames(survey, nodeDef),
      insertValues
    ))
  }
}

module.exports = {
  run
}