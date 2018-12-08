const Promise = require('bluebird')

const Survey = require('../../common/survey/survey')
const Record = require('../../common/record/record')

const DataSchema = require('./schemaRdb/dataSchema')
const DataTable = require('./schemaRdb/dataTable')

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
    schemaName: DataSchema.getName(Survey.getSurveyInfo(survey).id),
    tableName: DataTable.getTableName(nodeDef, nodeDefParent),
    colNames: DataTable.getColumnNames(survey, nodeDef),
    values
  }))
}

module.exports = {
  toInserts
}