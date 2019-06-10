const R = require('ramda')

const db = require('../../../../db/db')

const SurveyUtils = require('../../../../../common/survey/surveyUtils')
const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const Record = require('../../../../../common/record/record')
const RecordStep = require('../../../../../common/record/recordStep')
const Node = require('../../../../../common/record/node')

const RecordUsersMap = require('../../service/update/recordUsersMap')
const RecordRepository = require('../../repository/recordRepository')
const SurveyManager = require('../../../survey/manager/surveyManager')
const RecordValidationManager = require('./recordValidationManager')
const NodeUpdateManager = require('./nodeUpdateManager')

const SurveyRdbManager = require('../../../surveyRdb/manager/surveyRdbManager')
const FileManager = require('../fileManager')

const SystemError = require('../../../../../server/utils/systemError')

const ActivityLog = require('../../../activityLog/activityLogger')

/**
 * =======
 * RECORD
 * =======
 */

//==== CREATE

const createRecord = async (user, surveyId, recordToCreate, client = db) =>
  await client.tx(async t => {
    const preview = Record.isPreview(recordToCreate)
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, preview, true, false, t)

    const record = await RecordRepository.insertRecord(surveyId, recordToCreate, t)
    if (!preview)
      await ActivityLog.log(user, surveyId, ActivityLog.type.recordCreate, recordToCreate, t)

    const rootNodeDef = Survey.getRootNodeDef(survey)

    const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(recordToCreate))

    return await persistNode(user, survey, record, rootNode, null, null, t)
  })

//==== UPDATE

const updateRecordStep = async (surveyId, recordUuid, stepId, client = db) => {
  await client.tx(async t => {
    const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, t)

    // check if the step exists and that is't adjacent to the current one
    const currentStepId = Record.getStep(record)
    const stepCurrent = RecordStep.getStep(currentStepId)
    const stepUpdate = RecordStep.getStep(stepId)

    if (RecordStep.areAdjacent(stepCurrent, stepUpdate)) {
      await RecordRepository.updateRecordStep(surveyId, recordUuid, stepId, t)
    } else {
      throw new SystemError({ key: 'cantUpdateStep' }, `Can't update step`)
    }
  })
}

//==== DELETE
const deleteRecord = async (user, surveyId, recordUuid) => {
  await db.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.recordDelete, { recordUuid }, t)
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
  })
}

const deleteRecordPreview = async (surveyId, recordUuid) =>
  await db.tx(async t => {
      await RecordRepository.deleteRecord(surveyId, recordUuid, t)
      await FileManager.deleteFilesByRecordUuids(surveyId, [recordUuid], t)
    }
  )

const deleteRecordsPreview = async (surveyId) =>
  await db.tx(async t => {
    const deletedRecordUuids = await RecordRepository.deleteRecordsPreview(surveyId, t)
    if (!R.isEmpty(deletedRecordUuids))
      await FileManager.deleteFilesByRecordUuids(surveyId, deletedRecordUuids, t)
  })

/**
 * ======
 * NODE
 * ======
 */
const persistNode = async (user, survey, record, node,
                           nodesUpdateListener = null, nodesValidationListener = null, t = db) =>
  await t.tx(async t =>
    await _onNodesUpdate(
      survey,
      record,
      await NodeUpdateManager.persistNode(user, survey, record, node, t),
      nodesUpdateListener,
      nodesValidationListener,
      t,
    )
  )

const deleteNode = async (user, survey, record, nodeUuid,
                          nodesUpdateListener = null, nodesValidationListener = null, t = db) =>
  await t.tx(async t =>
    await _onNodesUpdate(
      survey,
      record,
      await NodeUpdateManager.deleteNode(user, survey, record, nodeUuid, t),
      nodesUpdateListener,
      nodesValidationListener,
      t,
    )
  )

const _onNodesUpdate = async (survey, record, updatedNodes,
                              nodesUpdateListener, nodesValidationListener, t) => {
  // 1. update record and notify
  if (nodesUpdateListener)
    nodesUpdateListener(updatedNodes)
  record = Record.assocNodes(updatedNodes)(record)

  // 2. update dependent nodes
  const updatedDependentNodes = await NodeUpdateManager.updateNodesDependents(survey, record, updatedNodes, t)
  if (nodesUpdateListener)
    nodesUpdateListener(updatedDependentNodes)
  record = Record.assocNodes(updatedDependentNodes)(record)

  const updatedNodesAndDependents = {
    ...updatedNodes,
    ...updatedDependentNodes
  }

  // 3. update node validations
  const validations = await RecordValidationManager.validateNodesAndPersistValidation(survey, record, updatedNodesAndDependents, t)
  if (nodesValidationListener)
    nodesValidationListener(validations)
  record = Record.mergeNodeValidations(validations)(record)

  if (Record.isPreview(record)) {
    // 4. touch preview record
    RecordUsersMap.touchPreviewRecord(Record.getUuid(record))
  } else {
    // 4. OR update survey rdb
    const nodeDefs = SurveyUtils.toUuidIndexedObj(
      Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodesAndDependents))(survey)
    )
    await SurveyRdbManager.updateTableNodes(survey, nodeDefs, updatedNodesAndDependents, t)
  }

  return record
}

module.exports = {
  // RECORD
  createRecord,
  updateRecordStep,

  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,

  // NODE
  insertNode: NodeUpdateManager.insertNode,
  persistNode,
  updateNodesDependents: NodeUpdateManager.updateNodesDependents,
  deleteNode,
}