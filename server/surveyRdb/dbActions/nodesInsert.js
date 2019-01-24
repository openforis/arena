const Promise = require('bluebird')

const Survey = require('../../../common/survey/survey')
const Record = require('../../../common/record/record')
const SchemaRdb = require('../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')

const getInsertValues = async (survey, nodeDef, record) => {
  const nodes = Record.getNodesByDefUuid(nodeDef.uuid)(record)
  const insertValues = await Promise.all(nodes.map(async node =>
    await DataTable.getRowValues(survey, nodeDef, record, node)
  ))
  return insertValues
}

const toInserts = async (survey, nodeDef, record) => {
  const insertValues = await getInsertValues(survey, nodeDef, record)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  return insertValues.map(values => ({
    schemaName: SchemaRdb.getName(Survey.getSurveyInfo(survey).id),
    tableName: DataTable.getName(nodeDef, nodeDefParent),
    colNames: DataTable.getColumnNames(survey, nodeDef),
    values
  }))
}

const run = async (survey, nodeDef, record, client) => {
  const inserts = await toInserts(survey, nodeDef, record)

  await client.tx(async t => await t.batch(
    inserts.map(insert => t.query(`
      INSERT INTO
        ${insert.schemaName}.${insert.tableName}
        (${insert.colNames.join(',')})
      VALUES
        (${insert.colNames.map((_, i) => `$${i + 1}`).join(',')})
      `,
      insert.values
    ))
  ))
}

module.exports = {
  run
}