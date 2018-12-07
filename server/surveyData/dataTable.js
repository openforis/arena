const R = require('ramda')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const DataRow = require('./dataRow')
const DataCol = require('./dataCol')

const colNameRecordUuuid = 'record_uuid'
const colNameUuuid = 'uuid'

const getNodeDefColumns = (survey, nodeDef) => {
  if (NodeDef.isNodeDefEntity(nodeDef)) {
// entity table
    return R.pipe(
      Survey.getNodeDefChildren(nodeDef),
      R.reject(NodeDef.isNodeDefMultiple),
      R.reject(NodeDef.isNodeDefEntity),
      R.concat(Survey.getAncestorsHierarchy(nodeDef)(survey)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )(survey)

  } else {
// multiple attr table
    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    return R.pipe(
      R.append(nodeDefParent),
      R.append(nodeDef),
      R.concat(Survey.getAncestorsHierarchy(nodeDefParent)(survey)),
      R.reject(R.isEmpty),
      R.sortBy(R.ascend(R.prop('id')))
    )([])

  }
}

const getColumnNames = (survey, nodeDef) => [
  colNameUuuid,
  colNameRecordUuuid,
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNames))
]

const getColumnNamesAndType = (survey, nodeDef) => [
  colNameUuuid + ' uuid NOT NULL',
  colNameRecordUuuid + ' uuid NOT NULL',
  ...R.flatten(getNodeDefColumns(survey, nodeDef).map(DataCol.getNamesAndType))
]

const getRowValues = async (survey, nodeDef, record, node) => {
  const rowValues = await DataRow.getValues(Survey.getSurveyInfo(survey), nodeDef, record, node, getNodeDefColumns(survey, nodeDef))
  return [node.uuid, record.uuid, ...R.flatten(rowValues)]
}

module.exports = {
  colNameRecordUuuid,
  colNameUuuid,
  getColumnNames,
  getColumnNamesAndType,
  getRowValues,
}