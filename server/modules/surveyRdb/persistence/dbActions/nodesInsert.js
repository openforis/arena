const Promise = require('bluebird')

const { insertAllQuery } = require('../../../../db/dbUtils')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const SchemaRdb = require('../../../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')

const run = async (survey, nodeDef, record, client) => {
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const nodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDef))(record)

  if (nodes.length > 0) {
    const insertValues = await Promise.all(nodes.map(async node =>
      await DataTable.getRowValues(survey, nodeDef, record, node, client)
    ))

    await client.none(insertAllQuery(
      SchemaRdb.getName(Survey.getId(survey)),
      DataTable.getName(nodeDef, nodeDefParent),
      DataTable.getColumnNames(survey, nodeDef),
      insertValues
    ))
  }
}

module.exports = {
  run
}