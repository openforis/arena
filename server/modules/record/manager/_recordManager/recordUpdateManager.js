import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as PromiseUtils from '@core/promiseUtils'
import * as ObjectUtils from '@core/objectUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Node from '@core/record/node'

import SystemError from '@core/systemError'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as FileRepository from '@server/modules/record/repository/fileRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'
import * as DataTableReadRepository from '@server/modules/surveyRdb/repository/dataTableReadRepository'

import * as RecordValidationManager from './recordValidationManager'
import * as NodeUpdateManager from './nodeUpdateManager'

/**
 * =======.
 * RECORD
 * =======.
 */

// ==== CREATE

export const initNewRecord = async (
  { user, survey, record, nodesUpdateListener = null, nodesValidationListener = null, createMultipleEntities = true },
  client = db
) => {
  const rootNodeDef = Survey.getNodeDefRoot(survey)

  const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(record))

  return persistNode(
    {
      user,
      survey,
      record,
      node: rootNode,
      nodesUpdateListener,
      nodesValidationListener,
      system: true,
      createMultipleEntities,
    },
    client
  )
}

// ==== UPDATE

export const updateRecordStep = async ({ user, surveyId, record, stepId, system = false }, client = db) => {
  // Check if the step exists and that is't adjacent to the current one
  const currentStepId = Record.getStep(record)
  const stepCurrent = RecordStep.getStep(currentStepId)
  const stepUpdate = RecordStep.getStep(stepId)

  if (RecordStep.areAdjacent(stepCurrent, stepUpdate)) {
    const recordUuid = Record.getUuid(record)
    const rootDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, client)

    await Promise.all([
      RecordRepository.updateRecordStep(surveyId, recordUuid, stepId, client),
      DataTableUpdateRepository.updateRecordStep({ surveyId, recordUuid, stepId, tableDef: rootDef }, client),
      ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.recordStepUpdate,
        {
          [ActivityLog.keysContent.uuid]: recordUuid,
          [ActivityLog.keysContent.stepFrom]: currentStepId,
          [ActivityLog.keysContent.stepTo]: stepId,
        },
        system,
        client
      ),
    ])
  } else {
    throw new SystemError('cantUpdateStep')
  }
}

export const updateRecordStepInTransaction = async ({ user, surveyId, record, stepId, system = false }, client = db) =>
  client.tx(async (t) => updateRecordStep({ user, surveyId, record, stepId, system }, t))

// ==== DELETE
export const deleteRecord = async (user, survey, record, client = db) =>
  client.tx(async (t) => {
    const { uuid } = record
    const rootDef = Survey.getNodeDefRoot(survey)
    const keys = await DataTableReadRepository.fetchEntityKeysByRecordAndNodeDefUuid(
      survey,
      NodeDef.getUuid(rootDef),
      uuid,
      null,
      t
    )
    const logContent = {
      [ActivityLog.keysContent.uuid]: uuid,
      [ActivityLog.keysContent.keys]: keys,
    }

    if (!R.isEmpty(Record.getNodes(record))) {
      // validate uniqueness of records with same keys/unique node values
      await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
        { survey, record, excludeRecordFromCount: true },
        t
      )
      const nodeDefsUnique = Survey.getNodeDefsRootUnique(survey)
      await PromiseUtils.each(nodeDefsUnique, (nodeDefUnique) =>
        RecordValidationManager.validateRecordUniqueNodesUniquenessAndPersistValidation(
          { survey, record, nodeDefUniqueUuid: nodeDefUnique.uuid, excludeRecordFromCount: true },
          t
        )
      )
    }

    const surveyId = Survey.getId(survey)
    await Promise.all([
      RecordRepository.deleteRecord(surveyId, uuid, t),
      FileRepository.markRecordFilesAsDeleted(surveyId, uuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordDelete, logContent, false, t),
    ])
  })

export const deleteRecordPreview = async (surveyId, recordUuid) =>
  await db.tx(async (t) => {
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
    await FileRepository.deleteFilesByRecordUuids(surveyId, [recordUuid], t)
  })

export const deleteRecordsPreview = async (surveyId, olderThan24Hours) =>
  db.tx(async (t) => {
    const recordUuids = await RecordRepository.deleteRecordsPreview(surveyId, olderThan24Hours, t)
    if (!R.isEmpty(recordUuids)) {
      await FileRepository.deleteFilesByRecordUuids(surveyId, recordUuids, t)
    }
    return recordUuids.length
  })

export const { deleteRecordsByCycles } = RecordRepository

/**
 * ======.
 * NODE
 * ======.
 */

// inserts/updates a node skipping record uniqueness validation
export const { insertNode, updateNode } = NodeUpdateManager

// inserts/updates a node and validate records uniqueness
export const persistNode = async (
  {
    user,
    survey,
    record,
    node,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    system = false,
    createMultipleEntities = true,
  },
  client = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    user,
    survey,
    record,
    node,
    (user, survey, record, node, t) =>
      NodeUpdateManager.persistNode({ user, survey, record, node, system, createMultipleEntities }, t),
    nodesUpdateListener,
    nodesValidationListener,
    client
  )

export const updateNodesDependents = NodeUpdateManager.updateNodesDependents

export const deleteNode = async (
  user,
  survey,
  record,
  nodeUuid,
  nodesUpdateListener = null,
  nodesValidationListener = null,
  t = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    user,
    survey,
    record,
    Record.getNodeByUuid(nodeUuid)(record),
    (user, survey, record, node, t) => NodeUpdateManager.deleteNode(user, survey, record, Node.getUuid(node), t),
    nodesUpdateListener,
    nodesValidationListener,
    t
  )

export const deleteNodesByNodeDefUuids = NodeUpdateManager.deleteNodesByNodeDefUuids

const _updateNodeAndValidateRecordUniqueness = async (
  user,
  survey,
  record,
  node,
  nodesUpdateFn,
  nodesUpdateListener = null,
  nodesValidationListener = null,
  client = db
) =>
  client.tx(async (t) => {
    await _beforeNodeUpdate({ survey, record, node }, t)

    const { record: recordUpdated1, nodes: nodesUpdated } = await nodesUpdateFn(user, survey, record, node, t)
    let recordUpdated = recordUpdated1

    const { record: recordUpdated2, nodes: updatedNodesAndDependents } = await _onNodesUpdate(
      { survey, record: recordUpdated, nodesUpdated, nodesUpdateListener, nodesValidationListener },
      t
    )
    recordUpdated = recordUpdated2
    await _afterNodesUpdate({ survey, record: recordUpdated, nodes: updatedNodesAndDependents }, t)

    return recordUpdated
  })

const _beforeNodeUpdate = async ({ survey, record, node }, t) => {
  if (Record.isPreview(record)) return

  const nodeDefUuid = Node.getNodeDefUuid(node)
  // Check if record key will be modified
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // validate records key and unique node values uniqueness
  if (!NodeDef.isRoot(Survey.getNodeDefParent(nodeDef)(survey))) return

  if (NodeDef.isKey(nodeDef)) {
    // Validate record uniqueness of records with same record keys
    await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
      { survey, record, excludeRecordFromCount: true },
      t
    )
  } else if (NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))) {
    // Validate record uniqueness of records with same record unique nodes
    await RecordValidationManager.validateRecordUniqueNodesUniquenessAndPersistValidation(
      { survey, record, nodeDefUniqueUuid: nodeDefUuid, excludeRecordFromCount: true },
      t
    )
  }
}

const _onNodesUpdate = async ({ survey, record, nodesUpdated, nodesUpdateListener, nodesValidationListener }, t) => {
  // 1. update record and notify
  if (nodesUpdateListener) {
    nodesUpdateListener(nodesUpdated)
  }

  // 2. update dependent nodes
  const { record: recordUpdatedDependentNodes, nodes: updatedDependentNodes } =
    await NodeUpdateManager.updateNodesDependents(survey, record, nodesUpdated, t)
  if (nodesUpdateListener) {
    nodesUpdateListener(updatedDependentNodes)
  }

  record = recordUpdatedDependentNodes

  const updatedNodesAndDependents = {
    ...nodesUpdated,
    ...updatedDependentNodes,
  }

  // 3. update node validations
  // exclude deleted nodes
  let recordUpdated = await validateNodesAndPersistToRDB(
    {
      survey,
      record,
      nodes: updatedNodesAndDependents,
      nodesValidationListener,
    },
    t
  )
  return {
    record: recordUpdated,
    nodes: updatedNodesAndDependents,
  }
}

const _afterNodesUpdate = async ({ survey, record, nodes }, t) => {
  if (!Record.isPreview(record)) {
    const nodeDefsModified = Object.values(nodes).map((node) =>
      Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    )

    // Check if root keys have been modified
    if (nodeDefsModified.some((nodeDef) => Survey.isNodeDefRootKey(nodeDef)(survey))) {
      // Validate record uniqueness of records with same record keys
      await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
        { survey, record, excludeRecordFromCount: false },
        t
      )
    }

    // Check if root unique nodes have been modified

    const rootUniqueNodeDefsModified = nodeDefsModified.filter((nodeDef) => {
      const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
      return NodeDef.isRoot(nodeDefParent) && NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))
    })
    if (rootUniqueNodeDefsModified.length > 0) {
      // for each modified node def, validate record uniqueness of records with same record unique nodes
      await PromiseUtils.each(rootUniqueNodeDefsModified, async (nodeDefUnique) =>
        RecordValidationManager.validateRecordUniqueNodesUniquenessAndPersistValidation(
          { survey, record, nodeDefUniqueUuid: NodeDef.getUuid(nodeDefUnique), excludeRecordFromCount: false },
          t
        )
      )
    }
  }
}

export const persistNodesToRDB = async ({ survey, record, nodesArray }, t) => {
  // include ancestor nodes (used to find the correct rdb table to update)
  const nodesAndDependentsAndAncestors = nodesArray.reduce((nodesAcc, node) => {
    Record.visitAncestorsAndSelf({ node, visitor: (n) => (nodesAcc[n.uuid] = n) })(record)
    return nodesAcc
  }, {})

  await DataTableUpdateRepository.updateTables({ survey, record, nodes: nodesAndDependentsAndAncestors }, t)

  // Merge updated nodes with existing ones (remove created/updated flags nodes)
  const nodes = ObjectUtils.toUuidIndexedObj(nodesArray)
  return Record.mergeNodes(nodes, true)(record)
}

const validateNodesAndPersistToRDB = async ({ survey, record, nodes, nodesValidationListener = null }, t) => {
  const nodesArray = Object.values(nodes)
  const nodesToValidate = nodesArray.reduce(
    (nodesAcc, node) => (Node.isDeleted(node) ? nodesAcc : { ...nodesAcc, [Node.getUuid(node)]: node }),
    {}
  )
  const validations = await RecordValidationManager.validateNodesAndPersistValidation(
    survey,
    record,
    nodesToValidate,
    true,
    t
  )
  if (nodesValidationListener) {
    nodesValidationListener(validations)
  }

  let recordUpdated = Record.mergeNodeValidations(validations)(record)

  // 4. update survey rdb
  if (!Record.isPreview(recordUpdated)) {
    recordUpdated = await persistNodesToRDB({ survey, record: recordUpdated, nodesArray }, t)
  }
  return recordUpdated
}
