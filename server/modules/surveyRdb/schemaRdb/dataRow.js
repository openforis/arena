const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const DataCol = require('./dataCol')

const getNodeCol = (nodeDefCol, record, nodeRow) => {

  const nodeDefUuidCol = NodeDef.getUuid(nodeDefCol)
  const nodeDefUuidRow = Node.getNodeDefUuid(nodeRow)

  // attribute column in multiple attribute table (value of its own table)
  const nodeCol = nodeDefUuidRow === nodeDefUuidCol ?
    nodeRow :
    R.pipe(
      Record.getNodeChildByDefUuid(nodeRow, nodeDefUuidCol),
      R.defaultTo({})
    )(record)

  return nodeCol
}

const getValues = async (surveyInfo, nodeDefRow, record, nodeRow, nodeDefColumns, surveyIndex, client) => {
  const values = await Promise.all(nodeDefColumns.map(async nodeDefCol => {
      const nodeCol = getNodeCol(nodeDefCol, record, nodeRow)

      const nodeColValues = await DataCol.getValues(surveyInfo, nodeDefCol, nodeCol, surveyIndex, client)

      return nodeColValues
    })
  )
  return R.flatten(values)
}

module.exports = {
  getValues,
}