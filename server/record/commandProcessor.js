const util = require('util')
const {EventEmitter} = require('events')
const R = require('ramda')

const {nodeDefType} = require('../../common/survey/nodeDef')
const {commandType, eventType, createNode} = require('../../common/record/record')
const {fetchNodeDef, fetchNodeDefsBySurveyId, fetchNodeDefsByParentId} = require('../nodeDef/nodeDefRepository')
const {getSurveyById} = require('../survey/surveyRepository')
const {createRecord} = require('../record/recordRepository')
const {insertNode, updateNode, deleteNode} = require('../record/nodeRepository')

const CommandProcessor = function CommandProcessor () {

  this.processCommand = async (command) => {
    switch (command.type) {
      case commandType.createRecord:
        return await this.processCreateRecordCommand(command)
      case commandType.addNode:
        return await this.processAddNodeCommand(command)
      case commandType.updateNode:
        return await this.processUpdateNodeCommand(command)
      case commandType.deleteNode:
        return await this.processDeleteNodeCommand(command)
      default:
        return []
    }
  }

  this.processCreateRecordCommand = async (command) => {
    //TODO do it in transaction

    const events = []
    const {surveyId, user} = command
    const survey = await getSurveyById(surveyId)
    const record = await createRecord(user, survey)

    events.push(this.emitEvent(
      eventType.recordCreated, {
        surveyId,
        user: command.user,
        record,
      }
    ))

    const nodeDefs = await fetchNodeDefsBySurveyId(survey.id)
    const rootNodeDef = R.find(n => n.parentId === null)(nodeDefs)

    const rootNodeEvents = await this.insertNodeInternal(survey.id, command.user, record.id, null, rootNodeDef)
    Array.prototype.push.apply(events, rootNodeEvents)

    return events
  }

  this.processAddNodeCommand = async (command) => {
    const {surveyId, recordId, nodeDefId, parentNodeId} = command

    const nodeDef = await fetchNodeDef(nodeDefId)
    return await this.insertNodeInternal(surveyId, command.user, recordId, parentNodeId, nodeDef)
  }

  this.processUpdateNodeCommand = async (command) => {
    const {surveyId, nodeId} = command

    const events = []

    const node = await updateNode(surveyId, nodeId, command.value)

    events.push(this.emitEvent(
      eventType.nodeUpdated, {
        surveyId,
        user: command.user,
        node,
      }
    ))
    return events
  }

  this.processDeleteNodeCommand = async (command) => {
    const {surveyId, nodeId} = command

    const events = []

    const node = await deleteNode(surveyId, nodeId)

    events.push(this.emitEvent(
      eventType.nodeDeleted, {
        surveyId,
        user: command.user,
        node,
      }
    ))
    return events
  }

  this.insertNodeInternal = async (surveyId, user, recordId, parentId, nodeDef) => {
    const events = []

    const node = await insertNode(surveyId, createNode(recordId, parentId, nodeDef.id))

    events.push(this.emitEvent(
      eventType.nodeAdded, {
        surveyId,
        user,
        node,
      }
    ))

    if (nodeDefType.entity === nodeDef.type) {
      const emptyChildrenEvents = await this.insertEmptyChildren(surveyId, user, node)
      Array.prototype.push.apply(events, emptyChildrenEvents)
    }
    return events
  }

  this.insertEmptyChildren = async (surveyId, user, parentNode) => {
    const events = []
    const childrenDefs = await fetchNodeDefsByParentId(parentNode.nodeDefId)

    await Promise.all(childrenDefs.map(async childDef => {
      const childInsertEvents = await this.insertNodeInternal(surveyId, user, parentNode.recordId, parentNode.id, childDef)
      Array.prototype.push.apply(events, childInsertEvents)
    }))

    return events
  }

  this.emitEvent = (type, event) => {
    this.emit(type, event)
    return {type, ...event}
  }
}

util.inherits(CommandProcessor, EventEmitter)

module.exports = {
  CommandProcessor,
}