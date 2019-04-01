const R = require('ramda')
const fastcsv = require('fast-csv')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefTable = require('../../../../common/surveyRdb/nodeDefTable')

const DataTable = require('../persistence/schemaRdb/dataTable')
const DataView = require('../persistence/schemaRdb/dataView')

const SurveyManager = require('../../survey/persistence/surveyManager')
const SurveyRdbManager = require('../persistence/surveyRdbManager')
const RecordManager = require('../../record/persistence/recordManager')

const exportTableToCSV = async (surveyId, tableName, cols, filter, sort, output) => {
  const csvStream = fastcsv.createWriteStream({ headers: true })
  csvStream.pipe(output)

  // 1. write headers
  csvStream.write(cols)

  let offset = 0
  const limit = 500
  let complete = false

  // 2. write rows
  while (!complete) {

    const rows = await SurveyRdbManager.queryTable(surveyId, tableName, cols, offset, limit, filter, sort)

    rows.forEach(row => {
      csvStream.write(R.values(row))
    })

    offset = offset + limit
    if (rows.length < limit)
      complete = true
  }

  // 3. close stream
  csvStream.end()
}

const queryTableForEdit = async (surveyId, tableName, cols = [],
                                 offset, limit, filter, sort) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId)

  const tableNodeDef = Survey.findNodeDef(nodeDef => tableName === DataView.getName(nodeDef, Survey.getNodeDefParent(nodeDef)(survey)))(survey)

  const ancestorAndSelfDefsColNames = R.pipe(
    Survey.getAncestorsHierarchy(tableNodeDef),
    R.append(tableNodeDef),
    defs => console.log(defs) || defs,
    R.map(nodeDef => `${NodeDef.getName(nodeDef)}_uuid`)
  )(survey)

  const queryCols = R.concat(ancestorAndSelfDefsColNames, cols)
  queryCols.push(DataTable.colNameRecordUuuid)

  const rows = await SurveyRdbManager.queryTable(surveyId, tableName, queryCols, offset, limit, filter, sort)

  /*rows.map(async row => {
    const recordId = row.recordId
    const parentUuid =
    const nodes = await RecordManager.fetchChildNodesByNodeDefUuid(surveyId, recordUuid, nodeUuid, childDefUUid)

  })*/


  rows.map({})

  return rows
}

module.exports = {

  queryTable: SurveyRdbManager.queryTable,

  queryTableForEdit,

  countTable: SurveyRdbManager.countTable,

  exportTableToCSV,
}