const R = require('ramda')

const NodeDef = require('../../common/survey/nodeDef')
const Record = require('../../common/record/record')
const DataCol = require('./dataCol')

const getNodeCol = (nodeDefCol, record, node) => {
  if (NodeDef.isNodeDefRoot(nodeDefCol))
    return Record.getRootNode(record)

  const nodeCol = R.pipe(
    Record.getNodeChildrenByDefUuid(node, nodeDefCol.uuid),
    R.head,
    R.defaultTo({})
  )(record)

  return NodeDef.isNodeDefEntity(nodeDefCol) && R.isEmpty(nodeCol)
    ? getNodeCol(nodeDefCol, record, Record.getParentNode(node)(record))
    : nodeCol

}

const getValues = (survey, nodeDefRow, record, nodeRow, nodeDefColumns) =>
  R.flatten(
    nodeDefColumns.map(nodeDefCol => {
        const nodeCol = getNodeCol(nodeDefCol, record, nodeRow)
        return DataCol.getValues(survey, nodeDefCol, record, nodeRow, nodeCol)
      }
    )
  )

module.exports = {
  getValues,
}