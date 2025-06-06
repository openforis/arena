import * as R from 'ramda'

import { NodePointers, Records, SurveyDependencyType } from '@openforis/arena-core'

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
import * as FileManager from '@server/modules/record/manager/fileManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'
import * as DataTableReadRepository from '@server/modules/surveyRdb/repository/dataTableReadRepository'

import * as RecordValidationManager from './recordValidationManager'
import * as NodeCreationManager from './nodeCreationManager'
import * as NodeUpdateManager from './nodeUpdateManager'
import { NodeRdbManager } from './nodeRDBManager'

/**
 * =======.
 * RECORD
 * =======.
 */

// ==== CREATE

export const initNewRecord = async (
  {
    user,
    survey,
    record,
    timezoneOffset,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    createMultipleEntities = true,
  },
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
      timezoneOffset,
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
      FileManager.markRecordFilesAsDeleted(surveyId, uuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordDelete, logContent, false, t),
    ])
  })

export const deleteRecordPreview = async (surveyId, recordUuid) =>
  await db.tx(async (t) => {
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
    await FileManager.deleteFilesByRecordUuids(surveyId, [recordUuid], t)
  })

export const deleteRecordsPreview = async (surveyId, olderThan24Hours) =>
  db.tx(async (t) => {
    const recordUuids = await RecordRepository.deleteRecordsPreview(surveyId, olderThan24Hours, t)
    if (!R.isEmpty(recordUuids)) {
      await FileManager.deleteFilesByRecordUuids(surveyId, recordUuids, t)
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
export const { updateNode } = NodeUpdateManager
export const { insertNode } = NodeCreationManager

// inserts/updates a node and validate records uniqueness
export const persistNode = async (
  {
    user,
    survey,
    record,
    node,
    timezoneOffset,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    system = false,
    createMultipleEntities = true,
  },
  client = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    {
      user,
      survey,
      record,
      node,
      timezoneOffset,
      nodesUpdateFn: async (user, survey, record, node, t) => {
        const nodeUuid = Node.getUuid(node)

        const existingNode = Record.getNodeByUuid(nodeUuid)(record)

        if (existingNode) {
          return NodeUpdateManager.updateNode({ user, survey, record, node, system }, t)
        }
        return NodeCreationManager.insertNode(
          { user, survey, record, node, system, createMultipleEntities, timezoneOffset },
          t
        )
      },
      nodesUpdateListener,
      nodesValidationListener,
    },
    client
  )

export const updateNodesDependents = NodeUpdateManager.updateNodesDependents

export const deleteNode = async (
  user,
  survey,
  record,
  nodeUuid,
  timezoneOffset,
  nodesUpdateListener = null,
  nodesValidationListener = null,
  t = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    {
      user,
      survey,
      record,
      node: Record.getNodeByUuid(nodeUuid)(record),
      timezoneOffset,
      nodesUpdateFn: (user, survey, record, node, t) =>
        NodeUpdateManager.deleteNode(user, survey, record, Node.getUuid(node), t),
      nodesUpdateListener,
      nodesValidationListener,
    },
    t
  )

export const { deleteNodesByNodeDefUuids, deleteNodesByUuids } = NodeUpdateManager

const _updateNodeAndValidateRecordUniqueness = async (
  {
    user,
    survey,
    record,
    node,
    categoryItemProvider,
    timezoneOffset,
    nodesUpdateFn,
    nodesUpdateListener = null,
    nodesValidationListener = null,
  },
  client = db
) =>
  client.tx(async (t) => {
    await _beforeNodeUpdate({ survey, record, node }, t)

    const { record: recordUpdated1, nodes: nodesUpdated } = await nodesUpdateFn(user, survey, record, node, t)
    let recordUpdated = recordUpdated1

    const { record: recordUpdated2, nodes: updatedNodesAndDependents } = await _onNodesUpdate(
      {
        user,
        survey,
        record: recordUpdated,
        nodesUpdated,
        timezoneOffset,
        nodesUpdateListener,
        nodesValidationListener,
      },
      t
    )
    recordUpdated = recordUpdated2
    await _afterNodesUpdate(
      { survey, record: recordUpdated, nodes: updatedNodesAndDependents, categoryItemProvider },
      t
    )

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

const validationDependencyTypes = [
  SurveyDependencyType.validations,
  SurveyDependencyType.minCount,
  SurveyDependencyType.maxCount,
]

const _getDependentNodesToValidate = ({ survey, record, nodes }) => {
  const dependentNodePointersToValidate = Object.values(nodes).reduce((acc, node) => {
    validationDependencyTypes.forEach((dependencyType) => {
      const dependentPointers = Records.getDependentNodePointers({
        survey,
        record,
        node,
        dependencyType,
        includeSelf: true,
      })
      acc.push(...dependentPointers)
    })
    return acc
  }, [])
  const dependentNodesToValidate = NodePointers.getNodesFromNodePointers({
    record,
    nodePointers: dependentNodePointersToValidate,
  })
  return { ...nodes, ...ObjectUtils.toUuidIndexedObj(dependentNodesToValidate) }
}

const _onNodesUpdate = async (
  { user, survey, record, nodesUpdated, timezoneOffset, nodesUpdateListener, nodesValidationListener },
  t
) => {
  // 1. update record and notify
  if (nodesUpdateListener) {
    nodesUpdateListener(nodesUpdated)
  }

  // 2. update dependent nodes
  const { record: recordUpdatedDependentNodes, nodes: updatedDependentNodes } =
    await NodeUpdateManager.updateNodesDependents({ user, survey, record, nodes: nodesUpdated, timezoneOffset }, t)
  if (nodesUpdateListener) {
    nodesUpdateListener(updatedDependentNodes)
  }

  record = recordUpdatedDependentNodes

  const updatedNodesAndDependents = {
    ...nodesUpdated,
    ...updatedDependentNodes,
  }

  // 3. update node validations
  const nodesToValidate = _getDependentNodesToValidate({ survey, record, nodes: updatedNodesAndDependents })

  const recordUpdated = await validateNodesAndPersistToRDB(
    { user, survey, record, nodes: nodesToValidate, nodesValidationListener },
    t
  )
  return {
    record: recordUpdated,
    nodes: updatedNodesAndDependents,
  }
}

const _afterNodesUpdate = async ({ survey, record, nodes }, t) => {
  if (Record.isPreview(record)) return

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
    return (
      NodeDef.isRoot(nodeDefParent) &&
      NodeDef.isSingle(nodeDef) &&
      NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))
    )
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
  const surveyId = Survey.getId(survey)
  const recordUuid = Record.getUuid(record)
  await RecordRepository.updateRecordDateModified({ surveyId, recordUuid }, t)
}

const validateNodesAndPersistToRDB = async ({ user, survey, record, nodes, nodesValidationListener = null }, t) => {
  const nodesArray = Object.values(nodes)
  const nodesToValidate = nodesArray.reduce(
    (nodesAcc, node) => (Node.isDeleted(node) ? nodesAcc : { ...nodesAcc, [Node.getUuid(node)]: node }),
    {}
  )
  const validations = await RecordValidationManager.validateNodesAndPersistValidation(
    { user, survey, record, nodes: nodesToValidate, validateRecordUniqueness: true },
    t
  )
  if (nodesValidationListener) {
    nodesValidationListener(validations)
  }

  let recordUpdated = Record.mergeNodeValidations(validations)(record)

  if (!Record.isPreview(recordUpdated)) {
    recordUpdated = await NodeRdbManager.persistNodesToRDB({ survey, record: recordUpdated, nodesArray }, t)
  }
  return recordUpdated
}
