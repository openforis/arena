const R = require('ramda')

const {nodeDefType} = require('../../common/survey/nodeDef')
const {commandType, eventType, createNode, createRootNode} = require('../../common/record/record')
const {fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {getSurveyById} = require('../survey/surveyRepository')
const {createRecord} = require('../record/recordRepository')
const {fetchNodes, insertNode, updateNode, deleteNode} = require('../record/nodeRepository')
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
  //LOG
  insertRecordCreatedLog(surveyId, command.user, record)

  const nodeDefs = await fetchNodeDefsBySurveyId(survey.id)
  const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

  const rootNode = await insertNode(survey.id, createRootNode(record.id, rootNodeDef.id))
  //LOG
  insertNodeAddedLog(surveyId, command.user, rootNode)

  await insertEmptyChildren(survey.id, user, rootNode)

  record.nodes = await fetchNodes(surveyId, record.id)

  return [{
    type: eventType.recordCreated,
    record,
  }]
}

const processAddNodeCommand = async (command) => {
  const {surveyId, recordId, nodeDefId, parentNodeId} = command

  const events = []

  const node = await insertNode(surveyId, createNode(recordId, parentNodeId, nodeDefId, command.value))
  //LOG
  await insertNodeAddedLog(surveyId, command.user, node)

  events.push({
    type: eventType.nodeAdded,
    node,
  })
  return events
}

const processUpdateNodeCommand = async (command) => {
  const {surveyId, nodeId} = command

  const events = []

  const node = await updateNode(surveyId, nodeId, command.value)
  await insertNodeUpdatedLog(surveyId, command.user, node)

  events.push({
    type: eventType.nodeUpdated,
    node,
  })
  return events
}

const processDeleteNodeCommand = async (command) => {
  const {surveyId, nodeId} = command

  const events = []

  const node = await deleteNode(surveyId, nodeId)
  //LOG
  await insertNodeDeletedLog(surveyId, command.user, node)

  events.push({
    type: eventType.nodeDeleted,
    node,
  })
  return events
}

const insertEmptyChildren = async (surveyId, user, parentNode) => {
  const childrenDefs = await fetchNodeDefsByParentId(parentNode.nodeDefId)

  await Promise.all(childrenDefs.map(async childDef => {
    const childNode = await insertNode(surveyId, createNode(parentNode.recordId, parentNode.id, childDef.id))
    //LOG
    await insertNodeAddedLog(surveyId, user, childNode)
  }))
}

module.exports = {
  processCommand,
}