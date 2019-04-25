const { insertAllQuery } = require('../../../../db/dbUtils')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const SchemaRdb = require('../../../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')

const getNodesRowValues = async (survey, nodeDef, record, client) => {
  const nodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDef))(record)

  const result = []
  for (const node of nodes) {
    const values = await DataTable.getRowValues(survey, nodeDef, record, node, client)
    result.push(values)
  }

  return result
}

const run = async (survey, nodeDef, record, client) => {
  const insertValues = []
  const valuesArr = await getNodesRowValues(survey, nodeDef, record, client)
  for (const values of valuesArr) {
    insertValues.push(values)
  }

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