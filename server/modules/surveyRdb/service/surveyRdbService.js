const R = require('ramda')
const fastcsv = require('fast-csv')
const Promise = require('bluebird')

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

const queryTableForEdit = async (user, surveyId, tableName, cols = [],
                                 offset, limit, filter, sort) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId)

  const tableNodeDef = Survey.findNodeDef(nodeDef => tableName === DataView.getName(nodeDef, Survey.getNodeDefParent(nodeDef)(survey)))(survey)

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

      // const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)
      const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

      const resultRow = {
        record,
        cols: {}
      }

      for (const ancestorDef of ancestorAndSelfDefs) {
        const childDefs = Survey.getNodeDefChildren(ancestorDef)(survey)

        for (const childDef of childDefs) {
          const childDefColNames = NodeDefTable.getColNames(childDef)
          if (R.pipe(
            R.intersection(childDefColNames),
            R.isEmpty,
            R.not
          )(cols)) {
            const ancestorUuidColName = `${NodeDef.getName(ancestorDef)}_uuid`
            const ancestorUuid = R.prop(ancestorUuidColName, row)
            const childDefUuid = NodeDef.getUuid(childDef)
            const nodes = await RecordManager.fetchChildNodesByNodeDefUuid(surveyId, recordUuid, ancestorUuid, childDefUuid)

            resultRow.cols[childDefUuid] = {
              nodes,
              parentUuid: ancestorUuid
            }
          }
        }
      }
      return resultRow
    }
  ))
}

module.exports = {

  queryTable: SurveyRdbManager.queryTable,

  queryTableForEdit,

  countTable: SurveyRdbManager.countTable,

  exportTableToCSV,
}