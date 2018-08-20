const R = require('ramda')

const {nodeDefType} = require('../../common/survey/nodeDef')
const {commandType, eventType, createNode} = require('../../common/record/record')
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

  const events = []
  const {surveyId, user} = command
  const survey = await getSurveyById(surveyId)
  const record = await createRecord(user, survey)

  events.push({
    type: eventType.recordCreated,
    record,
  })

  //TODO handle with event observer
  //LOG
  insertRecordCreatedLog(surveyId, command.user, record)

  const nodeDefs = await fetchNodeDefsBySurveyId(survey.id)
  const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

  const rootNodeEvents = await insertNodeInternal(survey.id, command.user, record.id, null, rootNodeDef)
  Array.prototype.push.apply(events, rootNodeEvents)

  return events
}

const processAddNodeCommand = async (command) => {
  const {surveyId, recordId, nodeDefId, parentNodeId} = command

  const nodeDef = await fetchNodeDef(nodeDefId)
  return await insertNodeInternal(surveyId, command.user, recordId, parentNodeId, nodeDef)
}

const processUpdateNodeCommand = async (command) => {
  const {surveyId, nodeId} = command

  const events = []

  const node = await updateNode(surveyId, nodeId, command.value)
  //LOG
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

const insertNodeInternal = async (surveyId, user, recordId, parentId, nodeDef) => {
  const events = []

  const node = await insertNode(surveyId, createNode(recordId, parentId, nodeDef.id))

  events.push({
    type: eventType.nodeAdded,
    node: node,
  })
  //TODO move it to event observer
  //LOG
  await insertNodeAddedLog(surveyId, user, node)

  if (nodeDefType.entity === nodeDef.type) {
    const emptyChildrenEvents = await insertEmptyChildren(surveyId, user, node)
    Array.prototype.push.apply(events, emptyChildrenEvents)
  }
  return events
}

const insertEmptyChildren = async (surveyId, user, parentNode) => {
  const events = []
  const childrenDefs = await fetchNodeDefsByParentId(parentNode.nodeDefId)

  await Promise.all(childrenDefs.map(async childDef => {
    const childInsertEvents = await insertNodeInternal(surveyId, user, parentNode.recordId, parentNode.id, childDef)
    Array.prototype.push.apply(events, childInsertEvents)
  }))

  return events
}

module.exports = {
  processCommand,
}