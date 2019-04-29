const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const Node = require('../../../../../common/record/node')
const DataCol = require('./dataCol')

const getNodeCol = (nodeDefCol, record, nodeRow) => {
  if (NodeDef.isRoot(nodeDefCol))
    return Record.getRootNode(record)

// attribute column in multiple attribute table (value of its own table)
  const nodeDefUuid = NodeDef.getUuid(nodeDefCol)

  const nodeCol = Node.getNodeDefUuid(nodeRow) === nodeDefUuid ?
    nodeRow :
    R.pipe(
      Record.getNodeChildByDefUuid(nodeRow, nodeDefUuid),
      R.defaultTo({})
    )(record)

  return NodeDef.isEntity(nodeDefCol) && R.isEmpty(nodeCol)
    ? getNodeCol(nodeDefCol, record, Record.getParentNode(nodeRow)(record))
    : nodeCol
}

const getValues = async (surveyInfo, nodeDefRow, record, nodeRow, nodeDefColumns, client) => {
  const values = await Promise.all(nodeDefColumns.map(async nodeDefCol => {
      const nodeCol = getNodeCol(nodeDefCol, record, nodeRow)

      const nodeColValues = await DataCol.getValues(surveyInfo, nodeDefCol, nodeCol, client)

      return nodeColValues
    })
  )
  return R.flatten(values)
}

module.exports = {
  getValues,
}