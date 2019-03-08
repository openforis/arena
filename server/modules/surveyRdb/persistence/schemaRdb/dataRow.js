const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const Node = require('../../../../../common/record/node')
const DataCol = require('./dataCol')

const getNodeCol = (nodeDefCol, record, nodeRow) => {
  if (NodeDef.isNodeDefRoot(nodeDefCol))
    return Record.getRootNode(record)

// attribute column in multiple attribute table (value of its own table)
  const nodeCol = Node.getNodeDefUuid(nodeRow) === nodeDefCol.uuid ?
    nodeRow :
    R.pipe(
      Record.getNodeChildrenByDefUuid(nodeRow, nodeDefCol.uuid),
      R.head,
      R.defaultTo({})
    )(record)

  return NodeDef.isNodeDefEntity(nodeDefCol) && R.isEmpty(nodeCol)
    ? getNodeCol(nodeDefCol, record, Record.getParentNode(nodeRow)(record))
    : nodeCol

}

const getValues = async (surveyInfo, nodeDefRow, record, nodeRow, nodeDefColumns) => {
  const values = await Promise.all(nodeDefColumns.map(async nodeDefCol => {
      const nodeCol = getNodeCol(nodeDefCol, record, nodeRow)
      return await DataCol.getValues(surveyInfo, nodeDefCol, nodeCol)
    })
  )
  return R.flatten(values)
}
module.exports = {
  getValues,
}