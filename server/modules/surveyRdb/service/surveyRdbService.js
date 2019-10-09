const R = require('ramda')
const fastcsv = require('fast-csv')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const DataTable = require('../schemaRdb/dataTable')

const SurveyManager = require('../../survey/manager/surveyManager')
const SurveyRdbManager = require('../manager/surveyRdbManager')
const RecordManager = require('../../record/manager/recordManager')

const exportTableToCSV = async (surveyId, cycle, tableName, cols, filter, sort, output) => {
  const csvStream = fastcsv.format({ headers: true })
  csvStream.pipe(output)

  // 1. write headers
  csvStream.write(cols)

  let offset = 0
  const limit = 500
  let complete = false

  // 2. write rows
  while (!complete) {

    const rows = await SurveyRdbManager.queryTable(surveyId, cycle, tableName, cols, offset, limit, filter, sort)

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

const queryTable = async (surveyId, cycle, nodeDefUuidTable, tableName, nodeDefUuidCols = [], cols = [],
                          offset, limit, filterExpr, sort, editMode = false) => {
  const surveySummary = await SurveyManager.fetchSurveyById(surveyId, true)
  const surveyInfo = Survey.getSurveyInfo(surveySummary)
  const loadDraftDefs = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, loadDraftDefs)

  // 1. find ancestor defs of table def
  const tableNodeDef = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)

  // 2. get hierarchy entities uuid col names
  const ancestorUuidColNames = []
  Survey.visitAncestorsAndSelf(
    tableNodeDef,
    nodeDefCurrent => ancestorUuidColNames.push(`${NodeDef.getName(nodeDefCurrent)}_uuid`)
  )(survey)

  // 3. prepare cols to fetch
  const queryCols = R.pipe(
    R.concat(ancestorUuidColNames),
    R.append(DataTable.colNameRecordUuuid)
  )(cols)

  // 4. fetch data
  let rows = await SurveyRdbManager.queryTable(surveyId, cycle, tableName, queryCols, offset, limit, filterExpr, sort)

  // 5. in edit mode, assoc nodes to columns
  if (editMode) {
    rows = await Promise.all(rows.map(
      async row => {
        const { record_uuid: recordUuid } = row

        const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

        const resultRow = {
          ...row,
          cols: {},
          record,
          parentNodeUuid: R.prop(`${NodeDef.getName(tableNodeDef)}_uuid`, row)
        }

        //assoc nodes to each columns
        for (const nodeDefUuidCol of nodeDefUuidCols) {
          const nodeDefCol = Survey.getNodeDefByUuid(nodeDefUuidCol)(survey)
          const nodeDefColParent = Survey.getNodeDefParent(nodeDefCol)(survey)
          const parentUuidColName = `${NodeDef.getName(nodeDefColParent)}_uuid`
          const parentUuid = R.prop(parentUuidColName, row)

          const nodes = await RecordManager.fetchChildNodesByNodeDefUuids(surveyId, recordUuid, parentUuid, [nodeDefUuidCol])

          resultRow.cols[nodeDefUuidCol] = {
            parentUuid,
            nodes: toUuidIndexedObj(nodes)
          }
        }

        return resultRow
      }
    ))
  }

  return rows
}

module.exports = {
  queryTable,
  countTable: SurveyRdbManager.countTable,
  exportTableToCSV,
}