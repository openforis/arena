const R = require('ramda')
const fastcsv = require('fast-csv')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const DataTable = require('../persistence/schemaRdb/dataTable')

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

const queryTable = async (user, surveyId, nodeDefUuidTable, tableName, nodeDefUuidCols = [], cols = [],
                          offset, limit, filter, sort, editMode = false) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId)

  // 1. find ancestor defs of table def
  const tableNodeDef = Survey.getNodeDefByUuid(nodeDefUuidTable)(survey)
  const ancestorDefs = Survey.getAncestorsHierarchy(tableNodeDef)(survey)
  const ancestorAndSelfDefs = R.append(tableNodeDef, ancestorDefs)

  const ancestorUuidColNames = ancestorAndSelfDefs.map(ancestor => `${NodeDef.getName(ancestor)}_uuid`)

  const queryCols = R.pipe(
    R.concat(ancestorUuidColNames),
    R.append(DataTable.colNameRecordUuuid)
  )(cols)

  const rows = await SurveyRdbManager.queryTable(surveyId, tableName, queryCols, offset, limit, filter, sort)

  return await Promise.all(rows.map(
    async row => {
      const { record_uuid: recordUuid } = row

      const resultRow = {
        ...row,
        cols: {}
      }

      if (editMode) {
        resultRow['record'] = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)
      }

      for (const ancestorDef of ancestorAndSelfDefs) {
        const childDefs = Survey.getNodeDefChildren(ancestorDef)(survey)
        const childDefsFiltered = R.filter(childDef => R.includes(NodeDef.getUuid(childDef), nodeDefUuidCols), childDefs)

        for (const childDef of childDefsFiltered) {
          const ancestorUuidColName = `${NodeDef.getName(ancestorDef)}_uuid`
          const ancestorUuid = R.prop(ancestorUuidColName, row)
          const childDefUuid = NodeDef.getUuid(childDef)

          resultRow.cols[childDefUuid] = {
            parentUuid: ancestorUuid
          }

          if (editMode) {
            const nodes = await RecordManager.fetchChildNodesByNodeDefUuid(surveyId, recordUuid, ancestorUuid, childDefUuid)
            resultRow.cols[childDefUuid]['nodes'] = toUuidIndexedObj(nodes)
          }
        }
      }
      return resultRow
    }
  ))
}

module.exports = {

  queryTable,

  countTable: SurveyRdbManager.countTable,

  exportTableToCSV,
}