const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../../../common/survey/nodeDef')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const RecordUpdater = require('../../../record/update/thread/helpers/recordUpdater')

const insertMissingSingleNodes = async (survey, nodeDefsNew, record, user, tx) => {
  const nodePointersDefsNew = R.pipe(
    R.map(def => {
      const parentNodes = Record.getNodesByDefUuid(NodeDef.getNodeDefParentUuid(def))(record)
      return R.map(parentNode => ({ parentNode, childDef: def }))(parentNodes)
    }),
    R.flatten
  )(nodeDefsNew)

  const updatedNodesArray = await Promise.all(
    nodePointersDefsNew.map(
      async nodePointer => await insertMissingSingleNode(survey, nodePointer.childDef, record, nodePointer.parentNode, user, tx)
    )
  )

  return R.flatten(updatedNodesArray)
}

const insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  if (NodeDef.isNodeDefSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), Node.getUuid(parentNode))
      return await new RecordUpdater().insertNode(survey, record, childNode, user, tx)
    }
  }
  return {}
}

module.exports = {
  insertMissingSingleNodes
}