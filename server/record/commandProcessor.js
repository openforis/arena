const R = require('ramda')

const {commandType, eventType, createNode} = require('../../common/record/record')
const {getSurveyById} = require('../survey/surveyRepository')
const {createRecord} = require('../record/recordRepository')
const {insertNode, updateNode} = require('../record/nodeRepository')

const processCommand = async (command) => {
  switch(command.type) {
    case commandType.createRecord:
      return await processCreateRecordCommand(command)
    case commandType.updateNode:
      return await processUpdateNodeCommand(command)
    default:
      return []
  }
}

const processCreateRecordCommand = async (command) => {
  const { surveyId, user } = command
  const survey = await getSurveyById(surveyId)
  const record = await createRecord(user, survey)
  return [{
    type: eventType.recordCreated,
    record,
  }]
}

const processUpdateNodeCommand = async (command) => {
  const { surveyId, recordId, nodeId, nodeDefId, parentNodeId } = command

  const events = []

  //TODO nodeId can be null? create nodes at record creation time?

  if (nodeId) {
    const updatedNode = await updateNode(surveyId, nodeId, command.value)

    events.push({
      type: eventType.nodeUpdated,
      node: updatedNode,
    })
  } else {
    const node = createNode(recordId, parentNodeId, nodeDefId, command.value)
    const newNode = await insertNode(surveyId, node)

    events.push({
      type: eventType.nodeAdded,
      node: newNode,
    })
  }
  return events
}

module.exports = {
  processCommand,
}