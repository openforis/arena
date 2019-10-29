const R = require('ramda')

const ActivityLog = require('@common/activityLog/activityLog')

const ObjectUtils = require('@core/objectUtils')
const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Record = require('@core/record/record')
const RecordStep = require('@core/record/recordStep')
const Node = require('@core/record/node')

const db = require('@server/db/db')
const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')
const SystemError = require('@server/utils/systemError')

const RecordRepository = require('@server/modules/record/repository/recordRepository')
const FileRepository = require('@server/modules/record/repository/fileRepository')
const DataTableUpdateRepository = require('@server/modules/surveyRdb/repository/dataTableUpdateRepository')

const RecordValidationManager = require('./recordValidationManager')
const NodeUpdateManager = require('./nodeUpdateManager')

/**
 * =======
 * RECORD
 * =======
 */

//==== CREATE

const initNewRecord = async (user, survey, record, nodesUpdateListener = null, nodesValidationListener = null, client = db) =>
  await client.tx(async t => {
    const rootNodeDef = Survey.getNodeDefRoot(survey)

    const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(record))

    return await persistNode(user, survey, record, rootNode, nodesUpdateListener, nodesValidationListener, t)
  })

//==== UPDATE

const updateRecordStep = async (user, surveyId, recordUuid, stepId, system = false, client = db) => {
  await client.tx(async t => {
    const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, t)

    // check if the step exists and that is't adjacent to the current one
    const currentStepId = Record.getStep(record)
    const stepCurrent = RecordStep.getStep(currentStepId)
    const stepUpdate = RecordStep.getStep(stepId)

    if (RecordStep.areAdjacent(stepCurrent, stepUpdate)) {
      await Promise.all([
        RecordRepository.updateRecordStep(surveyId, recordUuid, stepId, t),
        ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordStepUpdate, {
          uuid: recordUuid,
          stepId
        }, system, t)
      ])
    } else {
      throw new SystemError('cantUpdateStep')
    }
  })
}

//==== DELETE
const deleteRecord = async (user, surveyId, recordUuid) =>
  await db.tx(async t => {
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordDelete, { uuid: recordUuid }, false, t)
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
  })

const deleteRecordPreview = async (surveyId, recordUuid) =>
  await db.tx(async t => {
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
    await FileRepository.deleteFilesByRecordUuids(surveyId, [recordUuid], t)
  })

const deleteRecordsPreview = async (surveyId, olderThan24Hours) =>
  await db.tx(async t => {
    const recordUuids = await RecordRepository.deleteRecordsPreview(surveyId, olderThan24Hours, t)
    if (!R.isEmpty(recordUuids)) {
      await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, t)
    }

    return recordUuids.length
  })

/**
 * ======
 * NODE
 * ======
 */
const persistNode = async (user, survey, record, node,
                           nodesUpdateListener = null, nodesValidationListener = null, t = db) =>
  await _updateNodeAndValidateRecordUniqueness(
    user,
    survey,
    record,
    node,
    (user, survey, record, node, t) => NodeUpdateManager.persistNode(user, survey, record, node, t),
    nodesUpdateListener,
    nodesValidationListener,
    t
  )

const deleteNode = async (user, survey, record, nodeUuid,
                          nodesUpdateListener = null, nodesValidationListener = null, t = db) =>
  await _updateNodeAndValidateRecordUniqueness(
    user,
    survey,
    record,
    Record.getNodeByUuid(nodeUuid)(record),
    (user, survey, record, node, t) => NodeUpdateManager.deleteNode(user, survey, record, Node.getUuid(node), t),
    nodesUpdateListener,
    nodesValidationListener,
    t
  )

const _updateNodeAndValidateRecordUniqueness = async (user, survey, record, node, nodesUpdateFn,
                                                      nodesUpdateListener = null, nodesValidationListener = null, t = db) =>
  await t.tx(async t => {
    await _beforeNodeUpdate(user, survey, record, node, t)

    const nodesUpdated = await nodesUpdateFn(user, survey, record, node, t)

    const { record: updatedRecord, updatedNodesAndDependents } = await _onNodesUpdate(
      survey,
      nodesUpdated,
      nodesUpdateListener,
      nodesValidationListener,
      t,
    )
    await _afterNodesUpdate(user, survey, updatedRecord, updatedNodesAndDependents, t)

    return updatedRecord
  })

const _beforeNodeUpdate = async (user, survey, record, node, t) => {
  if (!Record.isPreview(record)) {
    // check if record key will be modified
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    if (Survey.isNodeDefRootKey(nodeDef)(survey)) {
      // validate record uniqueness of records with same record keys
      await RecordValidationManager.validateRecordsUniquenessAndPersistValidation(survey, record, true, t)
    }
  }
}

const _onNodesUpdate = async (survey, { record, nodes: updatedNodes },
                              nodesUpdateListener, nodesValidationListener, t) => {
  // 1. update record and notify
  if (nodesUpdateListener)
    nodesUpdateListener(updatedNodes)

  // 2. update dependent nodes
  const { record: recordUpdatedDependentNodes, nodes: updatedDependentNodes } = await NodeUpdateManager.updateNodesDependents(survey, record, updatedNodes, t)
  if (nodesUpdateListener)
    nodesUpdateListener(updatedDependentNodes)
  record = recordUpdatedDependentNodes

  const updatedNodesAndDependents = {
    ...updatedNodes,
    ...updatedDependentNodes
  }

  // 3. update node validations
  const validations = await RecordValidationManager.validateNodesAndPersistValidation(survey, record, updatedNodesAndDependents, true, t)
  if (nodesValidationListener)
    nodesValidationListener(validations)
  record = Record.mergeNodeValidations(validations)(record)

  // 4. update survey rdb
  if (!Record.isPreview(record)) {
    const nodeDefs = ObjectUtils.toUuidIndexedObj(
      Survey.getNodeDefsByUuids(Node.getNodeDefUuids(updatedNodesAndDependents))(survey)
    )
    await DataTableUpdateRepository.updateTable(survey, Record.getCycle(record), nodeDefs, updatedNodesAndDependents, t)
  }

  return {
    record,
    updatedNodesAndDependents
  }
}

const _afterNodesUpdate = async (user, survey, record, nodes, t) => {
  if (!Record.isPreview(record)) {
    // check if root key has been modified
    const rootKeyModified = R.any(node => {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      return Survey.isNodeDefRootKey(nodeDef)(survey)
    })(Object.values(nodes))

    if (rootKeyModified) {
      // validate record uniqueness of records with same record keys
      await RecordValidationManager.validateRecordsUniquenessAndPersistValidation(survey, record, false, t)
    }
  }
}

module.exports = {
  // RECORD
  initNewRecord,
  updateRecordStep,

  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,
  deleteRecordsByCycles: RecordRepository.deleteRecordsByCycles,

  // NODE
  insertNode: NodeUpdateManager.insertNode,
  persistNode,
  updateNodesDependents: NodeUpdateManager.updateNodesDependents,
  deleteNode,
  deleteNodesByNodeDefUuids: NodeUpdateManager.deleteNodesByNodeDefUuids
}