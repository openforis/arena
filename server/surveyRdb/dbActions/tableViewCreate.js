const Survey = require('../../../common/survey/survey')

const DataSchema = require('../schemaRdb/dataSchema')
const DataTable = require('../schemaRdb/dataTable')
const DataView = require('../schemaRdb/dataView')

const toTableViewCreate = (survey, nodeDef) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const schemaName = DataSchema.getName(surveyId)
  const tableName = DataTable.getNameFromDefs(nodeDef, nodeDefParent)
  return {
    schemaName,
    tableName,
    colsAndType: DataTable.getColumnNamesAndType(survey, nodeDef),
    parentForeignKey: DataTable.getParentForeignKey(surveyId, schemaName, nodeDef, nodeDefParent),
    uuidUniqueIdx: DataTable.getUuidUniqueConstraint(nodeDef),

    viewName: DataView.getNameFromDefs(nodeDef, nodeDefParent),
    viewFields: DataView.getSelectFields(survey, nodeDef),
    viewFrom: `${schemaName}.${tableName} as ${DataView.alias}`,
    viewJoin: DataView.getJoin(schemaName, nodeDef, nodeDefParent),
  }
}

const run = async (survey, nodeDef, client) => {
  const tableViewCreate = toTableViewCreate(survey, nodeDef)

  await client.query(`
    CREATE TABLE
      ${tableViewCreate.schemaName}.${tableViewCreate.tableName}
    (
      id          bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${tableViewCreate.colsAndType.join(',')},
      ${tableViewCreate.uuidUniqueIdx},
      ${tableViewCreate.parentForeignKey},
      PRIMARY KEY (id)
    )
  `)

  await client.query(`
    CREATE VIEW
      ${tableViewCreate.schemaName}.${tableViewCreate.viewName} AS 
      SELECT ${tableViewCreate.viewFields.join(',')}
      FROM ${tableViewCreate.viewFrom}
      ${tableViewCreate.viewJoin}
  `)
}

module.exports = {
  run
}