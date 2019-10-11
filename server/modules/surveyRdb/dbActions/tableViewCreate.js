const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const SchemaRdb = require('../../../../core/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')
const DataView = require('../schemaRdb/dataView')

const toTableViewCreate = (survey, nodeDef) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  const schemaName = SchemaRdb.getName(surveyId)
  const tableName = DataTable.getName(nodeDef, nodeDefParent)
  return {
    schemaName,
    tableName,
    colsAndType: DataTable.getColumnNamesAndType(survey, nodeDef),
    recordForeignKey: DataTable.getRecordForeignKey(surveyId, nodeDef),
    parentForeignKey: DataTable.getParentForeignKey(surveyId, schemaName, nodeDef, nodeDefParent),
    uuidUniqueIdx: DataTable.getUuidUniqueConstraint(nodeDef),

    viewName: DataView.getName(nodeDef, nodeDefParent),
    viewFields: DataView.getSelectFields(survey, nodeDef),
    viewFrom: `${schemaName}.${tableName} as ${DataView.alias}`,
    viewJoin: DataView.getJoin(schemaName, nodeDefParent),
  }
}

const run = async (survey, nodeDef, client) => {
  const tableViewCreate = toTableViewCreate(survey, nodeDef)

  await client.query(`
    CREATE TABLE
      ${tableViewCreate.schemaName}.${tableViewCreate.tableName}
    (
      id bigserial NOT NULL,
      date_created  TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      date_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC'),
      ${tableViewCreate.colsAndType.join(', ')},
      ${tableViewCreate.uuidUniqueIdx},
      ${tableViewCreate.recordForeignKey}
      ${NodeDef.isRoot(nodeDef) ? '' : ', ' + tableViewCreate.parentForeignKey},
      PRIMARY KEY (id)
    )
  `)

  await client.query(`
    CREATE VIEW
      ${tableViewCreate.schemaName}.${tableViewCreate.viewName} AS 
      SELECT ${tableViewCreate.viewFields.join(', ')}
      FROM ${tableViewCreate.viewFrom}
      ${tableViewCreate.viewJoin}
  `)
}

module.exports = {
  run
}