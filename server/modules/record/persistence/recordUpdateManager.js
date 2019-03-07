const R = require('ramda')

const SurveyUtils = require('../../../../common/survey/surveyUtils')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')
const Record = require('../../../../common/record/record')

const RecordRepository = require('./recordRepository')
const NodeUpdateManager = require('./nodeUpdateManager')
const RecordUsersMap = require('./recordUsersMap')
const DependentNodesUpdater = require('./dependentNodesUpdater')
const RecordValidationManager = require('../validator/recordValidationManager')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const ActivityLog = require('../../../activityLog/activityLogger')

// ==== UTILS

const logActivity = async () => await R.apply(ActivityLog.log, arguments)

/**
 * ==== RECORD
 */

//==== CREATE
const createRecord = async (user, survey, recordToCreate, preview, nodesUpdateListener, nodesValidationListener, t) => {
  const surveyId = Survey.getId(survey)

  const record = await RecordRepository.insertRecord(surveyId, recordToCreate, t)
  if (!preview)
    await logActivity(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)

  const rootNodeDef = Survey.getRootNodeDef(survey)
  const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(recordToCreate))

  return await persistNode(user, survey, record, rootNode, preview, nodesUpdateListener, nodesValidationListener, t)
}

const persistNode = async (user, survey, record, node, preview, nodesUpdateListener, nodesValidationListener, t) => {
  const updatedNodes = await NodeUpdateManager.persistNode(user, survey, record, node, preview, t)

  return await onNodesUpdate(survey, record, updatedNodes, preview, nodesUpdateListener, nodesValidationListener, t)
}

const deleteNode = async (user, survey, record, nodeUuid, preview, nodesUpdateListener, nodesValidationListener, t) => {
  const updatedNodes = await NodeUpdateManager.deleteNode(user, survey, record, nodeUuid, preview, t)

  return await onNodesUpdate(survey, record, updatedNodes, preview, nodesUpdateListener, nodesValidationListener, t)
}

const onNodesUpdate = async (survey, record, updatedNodes, preview, nodesUpdateListener, nodesValidationListener, t) => {
  record = Record.assocNodes(updatedNodes)(record)
  nodesUpdateListener(updatedNodes, t)

  // 2. update dependent nodes
  const updatedDependentNodes = await DependentNodesUpdater.updateNodes(survey, record, updatedNodes, t)
  record = Record.assocNodes(updatedDependentNodes)(record)
  nodesUpdateListener(updatedDependentNodes)

  const updatedNodesAndDependents = R.mergeDeepRight(updatedNodes, updatedDependentNodes)

  // 3. update node validations
  const validations = await RecordValidationManager.validateNodes(survey, record, updatedNodesAndDependents, preview, t)
  record = Record.mergeNodeValidations(validations)(record)
  nodesValidationListener(validations)

  if (preview) {
    // 4. touch preview record
    RecordUsersMap.touchPreviewRecord(Record.getUuid(record))
  } else {
    // 4. OR update survey rdb
    const nodeDefs = SurveyUtils.toUuidIndexedObj(
      Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodesAndDependents))(survey)
    )
    await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(survey), nodeDefs, updatedNodesAndDependents, t)
  }

  return record
}

module.exports = {
  createRecord,
  persistNode,
  deleteNode,
}