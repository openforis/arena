const R = require('ramda')

const NodeDef = require('../../../../common/survey/nodeDef')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const RecordUpdateManager = require('../../../modules/record/persistence/recordUpdateManager')

/**
 * Inserts missing single nodes.
 * Returns an indexed object with all the inserted nodes.
 */
const insertMissingSingleNodes = async (survey, nodeDefsNew, record, user, tx) => {
  let allInsertedNodes = {}
  for (const nodeDef of nodeDefsNew) {
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getNodeDefParentUuid(nodeDef))(record)
    for (const parentNode of parentNodes) {
      const insertedNodes = await insertMissingSingleNode(survey, nodeDef, record, parentNode, user, tx)
      allInsertedNodes = R.mergeRight(allInsertedNodes, insertedNodes)
    }
  }
  return allInsertedNodes
}

const insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  if (NodeDef.isNodeDefSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), Node.getUuid(parentNode))
      return await RecordUpdateManager.insertNode(survey, record, childNode, user, tx)
    }
  }
  return {}
}
module.exports = {
  insertMissingSingleNodes
}