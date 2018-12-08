const Survey = require('../../common/survey/survey')

const DataSchema = require('./schemaRdb/dataSchema')
const DataTable = require('./schemaRdb/dataTable')
const DataView = require('./schemaRdb/dataView')

const toTableViewCreate = (survey, nodeDef) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const schemaName = DataSchema.getName(surveyId)
  const tableName = DataTable.getTableName(nodeDef, nodeDefParent)
  return {
    schemaName,
    tableName,
    tableColsAndType: DataTable.getColumnNamesAndType(survey, nodeDef),
    parentForeignKey: DataTable.getParentForeignKey(surveyId, schemaName, nodeDef, nodeDefParent),
    uuidUniqueIdx: DataTable.getUuidUniqueConstraint(nodeDef),

    viewName: DataView.getName(nodeDef, nodeDefParent),
    viewSelectFields: DataView.getSelectFields(survey, nodeDef),
    viewSelectFrom: `${schemaName}.${tableName} as ${DataView.alias}`,
    viewJoin: DataView.getJoin(schemaName, nodeDef, nodeDefParent),
  }
}

module.exports = {
  toTableViewCreate
}