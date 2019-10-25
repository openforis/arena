const R = require('ramda')

const Queue = require('@core/queue')

const ObjectUtils = require('@core/objectUtils')
const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Node = require('@core/record/node')
const Record = require('@core/record/record')

const NodeUpdateDependentManager = require('./nodeUpdateDependentManager')
const NodeRepository = require('../../repository/nodeRepository')

const ActivityLog = require('../../../activityLog/activityLogger')

//==== UPDATE

const persistNode = async (user, survey, record, node, t) => {
  const nodeUuid = Node.getUuid(node)

  const existingNode = Record.getNodeByUuid(nodeUuid)(record)

  if (existingNode) {
    // update
    const surveyId = Survey.getId(survey)
    if (!Record.isPreview(record))
      await ActivityLog.log(user, surveyId, ActivityLog.type.nodeValueUpdate, R.pick(['uuid', 'value'], node), false, t)

    const nodeValue = Node.getValue(node)
    const meta = {
      ...Node.getMeta(node),
      [Node.metaKeys.defaultValue]: false
    }
    const nodeUpdate = await NodeRepository.updateNode(surveyId, nodeUuid, nodeValue, meta, Record.isPreview(record), t)

    record = Record.assocNode(nodeUpdate)(record)

    return await _onNodeUpdate(survey, record, nodeUpdate, {}, t)

  } else {
    // create
    return await insertNode(user, survey, record, node, false, t)
  }
}

const updateNodesDependents = async (survey, record, nodes, tx) => {
  // output
  let nodesUpdated = { ...nodes }

  const nodesArray = Object.values(nodes)
  const nodesToVisit = new Queue(nodesArray)

  const nodesVisitedByUuid = {} //used to avoid visiting the same node 2 times

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    // visit only unvisited nodes
    if (!nodesVisitedByUuid[nodeUuid]) {

      // update node dependents
      const [nodesApplicability, nodesDefaultValues] = await Promise.all([
        NodeUpdateDependentManager.updateDependentsApplicable(survey, record, node, tx),
        NodeUpdateDependentManager.updateDependentsDefaultValues(survey, record, node, tx)
      ])

      // update record nodes
      const nodesUpdatedCurrent = {
        ...nodesApplicability,
        ...nodesDefaultValues
      }
      record = Record.assocNodes(nodesUpdatedCurrent)(record)

      // mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // update nodes to return
      Object.assign(nodesUpdated, nodesUpdatedCurrent)

      // mark node visited
      nodesVisitedByUuid[nodeUuid] = true
    }
  }

  return {
    record,
    nodes: nodesUpdated
  }
}

// ==== CREATE
const insertNode = async (user, survey, record, node, system, t) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isCode(nodeDef)) {
    const nodeParent = Record.getParentNode(node)(record)
    const siblings = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
    if (R.any(sibling => R.equals(Node.getValue(sibling), Node.getValue(node)))(siblings)) {
      return {}
    }
  }

  const nodesToReturn = await _insertNodeRecursively(user, survey, nodeDef, record, node, system, t)

  return _createUpdateResult(record, node, nodesToReturn)
}

const _insertNodeRecursively = async (user, survey, nodeDef, record, nodeToInsert, system, t) => {
  const surveyId = Survey.getId(survey)

  if (!Record.isPreview(record))
    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, system, t)

  // insert node
  const node = await NodeRepository.insertNode(surveyId, nodeToInsert, Record.isPreview(record), t)

  record = Record.assocNode(node)(record)

  // add children if entity
  const childDefs = NodeDef.isEntity(nodeDef)
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  // insert only child single nodes (it allows to apply default values)
  const childNodes = {}
  for (const childDef of childDefs) {
    if (NodeDef.isSingle(childDef)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
      const childNodesInserted = await _insertNodeRecursively(user, survey, childDef, record, childNode, system, t)
      Object.assign(childNodes, childNodesInserted)
    }
  }

  return {
    ...childNodes,
    [Node.getUuid(node)]: node
  }
}

//==== DELETE

const deleteNode = async (user, survey, record, nodeUuid, t) => {
  const surveyId = Survey.getId(survey)

  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

  if (!Record.isPreview(record))
    await ActivityLog.log(user, surveyId, ActivityLog.type.nodeDelete, { uuid: nodeUuid }, false, t)

  // get dependent key attributes before node is removed from record
  // and return them so they will be re-validated later on
  const nodeDependentKeyAttributes = _getNodeDependentKeyAttributes(survey, record, node)

  record = Record.assocNode(node)(record)

  return await _onNodeUpdate(survey, record, node, nodeDependentKeyAttributes, t)
}

const deleteNodesByNodeDefUuids = async (user, surveyId, nodeDefsUuids, record, client = db) =>
  await client.tx(async t => {
    const nodesDeleted = await NodeRepository.deleteNodesByNodeDefUuids(surveyId, nodeDefsUuids, t)
    const activities = nodesDeleted.map(node => ActivityLog.newActivity(ActivityLog.type.nodeDelete, { uuid: Node.getUuid(node) }, true))
    await ActivityLog.logMany(user, surveyId, activities, t)
    return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodesDeleted))(record)
  })

const _onNodeUpdate = async (survey, record, node, nodeDependents = {}, t) => {
  // TODO check if it should be removed
  const surveyId = Survey.getId(survey)

  let updatedNodes = nodeDependents

  // delete dependent code nodes
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isCode(nodeDef)) {
    const dependentCodes = Record.getDependentCodeAttributes(node)(record)

    if (!R.isEmpty(dependentCodes)) {
      const deletedNodesArray = await Promise.all(
        dependentCodes.map(nodeCode => NodeRepository.deleteNode(surveyId, Node.getUuid(nodeCode), t))
      )
      updatedNodes = {
        ...updatedNodes,
        ...ObjectUtils.toUuidIndexedObj(deletedNodesArray)
      }
    }
  }

  return _createUpdateResult(record, node, updatedNodes)
}

const _createUpdateResult = (record, node, nodes) => {
  record = Record.assocNodes(nodes)(record)

  const parentNode = Record.getParentNode(node)(record)

  return {
    record,
    nodes: {
      [Node.getUuid(node)]: node,
      //always assoc parentNode, used in surveyRdbManager.updateTableNodes
      ...parentNode ? { [Node.getUuid(parentNode)]: parentNode } : {},
      ...nodes
    }
  }
}

const _getNodeDependentKeyAttributes = (survey, record, node) => {
  const nodeDependentKeyAttributes = {}
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isMultipleEntity(nodeDef)) {
    //find sibling entities with same key values
    const nodeDeletedKeyValues = Record.getEntityKeyValues(survey, node)(record)
    if (!R.isEmpty(nodeDeletedKeyValues)) {
      const nodeParent = Record.getParentNode(node)(record)
      const nodeSiblings = R.pipe(
        Record.getNodeChildrenByDefUuid(nodeParent, NodeDef.getUuid(nodeDef)),
        R.reject(ObjectUtils.isEqual(node))
      )(record)

      nodeSiblings.forEach(nodeSibling => {
        const nodeKeys = Record.getEntityKeyNodes(survey, nodeSibling)(record)
        // if key nodes are the same as the ones of the deleted node,
        // add them to the accumulator
        const nodeKeyValues = R.map(Node.getValue)(nodeKeys)

        if (R.equals(nodeKeyValues, nodeDeletedKeyValues)) {
          nodeKeys.forEach(nodeKey => nodeDependentKeyAttributes[Node.getUuid(nodeKey)] = nodeKey)
        }
      })
    }
  }
  return nodeDependentKeyAttributes
}

module.exports = {
  insertNode,
  persistNode,
  updateNodesDependents,
  deleteNode,
  deleteNodesByNodeDefUuids
}
