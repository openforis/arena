const R = require('ramda')

const {nodeDefType} = require('../../common/survey/nodeDef')
const {commandType, createNode} = require('../../common/record/record')
const {fetchNodeDef, fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {getSurveyById} = require('../survey/surveyRepository')
const {createRecord} = require('../record/recordRepository')
const {insertNode, updateNode, deleteNode} = require('../record/nodeRepository')
const {insertRecordCreatedLog, insertNodeAddedLog, insertNodeUpdatedLog, insertNodeDeletedLog} = require('../record/recordLogRepository')

const processCommand = async (command) => {
  switch (command.type) {
    case commandType.createRecord:
      return await processCreateRecordCommand(command)
    case commandType.addNode:
      return await processAddNodeCommand(command)
    case commandType.updateNode:
      return await processUpdateNodeCommand(command)
    case commandType.deleteNode:
      return await processDeleteNodeCommand(command)
    default:
      return []
  }
}

const processCreateRecordCommand = async (command) => {
  //TODO do it in transaction

  const {surveyId, user} = command

  const survey = await getSurveyById(surveyId)

  const record = await createRecord(user, survey)

  //history
  await insertRecordCreatedLog(surveyId, user, record)

  const nodeDefs = await fetchNodeDefsBySurveyId(survey.id)
  const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

  record.nodes = await insertNodeInternal(survey.id, command.user, record.id, null, rootNodeDef)

  return record
}

const processAddNodeCommand = async (command) => {
  const {surveyId, user, recordId, nodeDefId, parentNodeId} = command

  const nodeDef = await fetchNodeDef(nodeDefId)

  return await insertNodeInternal(surveyId, user, recordId, parentNodeId, nodeDef)
}

const processUpdateNodeCommand = async (command) => {
  const {surveyId, user, nodeId} = command

  const updatedNodes = []

  const node = await updateNode(surveyId, nodeId, command.value)

  //history
  await insertNodeUpdatedLog(surveyId, user, node)

  updatedNodes.push(node)

  //TODO evaluate dependent expressions
  return updatedNodes
}

processDeleteNodeCommand = async (command) => {
  const {surveyId, user, nodeId} = command

  const updatedNodes = []

  const node = await deleteNode(surveyId, nodeId)

  //history
  await insertNodeDeletedLog(surveyId, user, node)

  //TODO evaluate dependent expressions
  return updatedNodes
}

insertNodeInternal = async (surveyId, user, recordId, parentId, nodeDef) => {
  const updatedNodes = []

  const node = await insertNode(surveyId, createNode(recordId, parentId, nodeDef.id))

  //TODO evaluate dependent expressions

  //history
  await insertNodeAddedLog(surveyId, user, node)

  updatedNodes.push(node)

  if (nodeDefType.entity === nodeDef.type) {
    //create empty nodes
    const emptyChildrenNodes = await insertEmptyChildren(surveyId, user, node)
    Array.prototype.push.apply(updatedNodes, emptyChildrenNodes)
  }
  return updatedNodes
}

insertEmptyChildren = async (surveyId, user, parentNode) => {
  const updatedNodes = []

  const childrenDefs = await fetchNodeDefsByParentId(parentNode.nodeDefId)

  await Promise.all(childrenDefs.map(async childDef => {
    const insertedNodes = await insertNodeInternal(surveyId, user, parentNode.recordId, parentNode.id, childDef)
    Array.prototype.push.apply(updatedNodes, insertedNodes)
  }))

  return updatedNodes
}

module.exports = {
  processCommand,
}