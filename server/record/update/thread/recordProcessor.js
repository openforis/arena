const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../db/db')

const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../../record/nodeRepository')

const persistNode = async (surveyId, node, client = db) => {
  const {uuid} = node

  const nodeDb = await NodeRepository.fetchNodeByUuid(surveyId, uuid, client)

  return nodeDb
    ? await updateNodeValue(surveyId, uuid, Node.getNodeValue(node), client)
    : await createNode(surveyId, await NodeDefRepository.fetchNodeDefByUuid(surveyId, Node.getNodeDefUuid(node)), node, client)
}

/**
 * Create a new node, and recursively creates inner nodes
 *
 */
const createNode = async (surveyId, nodeDef, nodeToInsert, client = db) => {

  // insert node
  const node = await NodeRepository.insertNode(surveyId, nodeToInsert, client)

  // add children if entity
  const childDefs = NodeDef.isNodeDefEntity(nodeDef)
    ? await NodeDefRepository.fetchNodeDefsByParentUuid(surveyId, nodeDef.uuid)
    : []

  // insert only child single entities
  const childNodes = R.mergeAll(
    await Promise.all(
      childDefs
        .filter(NodeDef.isNodeDefSingleEntity)
        .map(
          async childDef => await createNode(surveyId, childDef, Node.newNode(childDef.uuid, node.recordId, node.uuid), null, client)
        )
    )
  )

  return R.mergeLeft({[node.uuid]: node}, childNodes)
}

/**
 * Update a node value
 *
 */
const updateNodeValue = async (surveyId, nodeUuid, value, client = db) =>
  await client.tx(async t => {
    const node = await NodeRepository.updateNode(surveyId, nodeUuid, value, client)

    return await onNodeUpdate(surveyId, node, t)
  })

/**
 * Delete a node
 *
 */
const deleteNode = async (surveyId, nodeUuid, client = db) =>
  await client.tx(async t => {
    const node = await deleteNodeInternal(surveyId, nodeUuid, t)

    return await onNodeUpdate(surveyId, node, t)
  })

const onNodeUpdate = async (surveyId, node, client = db) => {
  //delete dependent code nodes
  const descendantCodes = await NodeRepository.fetchDescendantNodesByCodeUuid(surveyId, node.recordId, node.uuid)

  //always returning parentNode, used in dataSchema.updateTableNodes
  const parentNode = await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), client)

  const nodesToReturn = [
    ...await Promise.all(
      descendantCodes.map(async nodeCode => await deleteNodeInternal(surveyId, nodeCode.uuid, client))
    ),
    {[parentNode.uuid]: {...parentNode, updated: false}}
  ]

  return R.mergeLeft(
    {[node.uuid]: {...node, updated: !node.deleted}},
    R.mergeAll(nodesToReturn)
  )
}

const deleteNodeInternal = async (surveyId, nodeUuid, client) => {
  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, client)
  return {...node, deleted: true, value: {}}
}

module.exports = {
  persistNode,
  deleteNode,
}