import {
  type ArenaAppInfo,
  type ArenaRecord,
  type ArenaRecordNode,
  type ArenaRecordNodePointer,
  type ArenaSurvey,
  type ArenaUser,
  type ArenaValidation,
  RecordNodePointers,
  Records,
  SurveyDependencyType,
  Surveys,
} from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordFileManager from '@server/modules/record/manager/recordFileManager'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as RecordPrintableExportShareService from '@server/modules/record/service/recordPrintableExportShareService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as DataTableReadRepository from '@server/modules/surveyRdb/repository/dataTableReadRepository'
import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'

import * as NodeCreationManager from './nodeCreationManager'
import { NodeRdbManager } from './nodeRDBManager'
import * as NodeUpdateManager from './nodeUpdateManager'
import * as RecordValidationManager from './recordValidationManager'

type NodesByUuid = { [nodeUuid: string]: ArenaRecordNode }

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
    lang,
    appInfo,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    createMultipleEntities = true,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    timezoneOffset?: number
    lang: string
    appInfo?: ArenaAppInfo
    nodesUpdateListener?: (nodes: NodesByUuid) => void
    nodesValidationListener?: (validation: ArenaValidation) => void
    createMultipleEntities?: boolean
  },
  client: DbClient = db
) => {
  const rootNodeDef = Survey.getNodeDefRoot(survey)

  const rootNode = Node.newNode(NodeDef.getUuid(rootNodeDef), Record.getUuid(record))

  const recordWithRootEntity = await persistNode(
    {
      user,
      survey,
      record,
      node: rootNode,
      timezoneOffset,
      lang,
      appInfo,
      nodesUpdateListener,
      nodesValidationListener,
      system: true,
      createMultipleEntities,
    },
    client
  )

  return _applyGroupQualifierValues(
    {
      user,
      survey,
      record: recordWithRootEntity,
      timezoneOffset,
      lang,
      appInfo,
      nodesUpdateListener,
      nodesValidationListener,
    },
    client
  )
}

// Auto-fills attributes flagged as "qualifier" with the value specified for them
// in the qualifiers of the current user's group for this survey, and marks
// the affected node as non-editable in the UI.
const _applyGroupQualifierValues = async (
  {
    user,
    survey,
    record,
    timezoneOffset,
    lang,
    appInfo,
    nodesUpdateListener,
    nodesValidationListener,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    timezoneOffset?: number
    lang: string
    appInfo?: ArenaAppInfo
    nodesUpdateListener: (nodes: NodesByUuid) => void
    nodesValidationListener: (validation: ArenaValidation) => void
  },
  client: DbClient
) => {
  const qualifierFilters = await SurveyManager.fetchUserQualifierFilters({ user, survey }, client)
  if (qualifierFilters.length === 0) return record

  const rootNode = Record.getRootNode(record)

  let recordUpdated = record

  for (const { nodeDef, value } of qualifierFilters) {
    const existingNode = Record.getNodeChildrenByDefUuid(rootNode, NodeDef.getUuid(nodeDef))(recordUpdated)[0]
    const nodeToPersist =
      existingNode ?? Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(recordUpdated), rootNode)
    const nodeWithValue = Node.assocIsQualifierValueApplied(true)(Node.assocValue(value)(nodeToPersist))

    recordUpdated = /* NOSONAR */ await persistNode(
      {
        user,
        survey,
        record: recordUpdated,
        node: nodeWithValue,
        timezoneOffset,
        lang,
        appInfo,
        nodesUpdateListener,
        nodesValidationListener,
        system: true,
      },
      client
    )
  }

  return recordUpdated
}

// ==== UPDATE

export const updateRecordStep = async (
  {
    user,
    surveyId,
    record,
    stepId,
    system = false,
  }: { user: ArenaUser; surveyId: number; record: ArenaRecord; stepId: string; system?: boolean },
  client: DbClient = db
) => {
  // Check if the step exists and that is't adjacent to the current one
  const currentStepId = Record.getStep(record)
  const stepCurrent = RecordStep.getStep(currentStepId)
  const stepUpdate = RecordStep.getStep(stepId)

  if (RecordStep.areAdjacent(stepCurrent, stepUpdate)) {
    const recordUuid = Record.getUuid(record)
    const rootDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, client)

    await DbUtils.runQueries(client, [
      () => RecordRepository.updateRecordStep(surveyId, recordUuid, stepId, client),
      () => DataTableUpdateRepository.updateRecordStep({ surveyId, recordUuid, stepId, tableDef: rootDef }, client),
      () =>
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

export const updateRecordStepInTransaction = (
  {
    user,
    surveyId,
    record,
    stepId,
    system = false,
  }: { user: ArenaUser; surveyId: number; record: ArenaRecord; stepId: string; system?: boolean },
  client: DbClient = db
) => client.tx((t) => updateRecordStep({ user, surveyId, record, stepId, system }, t))

// ==== DELETE
export const deleteRecord = (user: ArenaUser, survey: ArenaSurvey, record: ArenaRecord, client: DbClient = db) =>
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
    const logContent = { [ActivityLog.keysContent.uuid]: uuid, [ActivityLog.keysContent.keys]: keys }

    if (!A.isEmpty(Record.getNodes(record))) {
      // validate uniqueness of records with same keys/unique node values
      await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
        { survey, record, excludeRecordFromCount: true },
        t
      )
      const nodeDefsUnique = Survey.getNodeDefsRootUnique(survey)
      for (const nodeDefUnique of nodeDefsUnique) {
        /* NOSONAR */ await RecordValidationManager.validateRecordUniqueNodesUniquenessAndPersistValidation(
          { survey, record, nodeDefUniqueUuid: nodeDefUnique.uuid, excludeRecordFromCount: true },
          t
        )
      }
    }

    const surveyId = Survey.getId(survey)
    await DbUtils.runQueries(t, [
      () => RecordRepository.deleteRecord(surveyId, uuid, t),
      () => RecordFileManager.markRecordFilesAsDeleted(surveyId, uuid, t),
      () => RecordPrintableExportShareService.deleteByRecordUuid({ surveyId, recordUuid: uuid }, t),
      () => ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordDelete, logContent, false, t),
    ])
  })

export const deleteRecordPreview = async (surveyId: number, recordUuid: string) =>
  await db.tx(async (t) => {
    await RecordRepository.deleteRecord(surveyId, recordUuid, t)
    await RecordPrintableExportShareService.deleteByRecordUuid({ surveyId, recordUuid }, t)
    await RecordFileManager.deleteFilesByRecordUuids(surveyId, [recordUuid], t)
  })

export const deleteRecordsPreview = (surveyId: number, olderThan24Hours: boolean) =>
  db.tx(async (t) => {
    const recordUuids = await RecordRepository.deleteRecordsPreview(surveyId, olderThan24Hours, t)
    if (!A.isEmpty(recordUuids)) {
      await RecordPrintableExportShareService.deleteByRecordUuids({ surveyId, recordUuids }, t)
      await RecordFileManager.deleteFilesByRecordUuids(surveyId, recordUuids, t)
    }
    return recordUuids.length
  })

export const deleteRecordsByCycles = async (surveyId: number, cycles: string[], client: DbClient = db) => {
  const recordUuids = await RecordRepository.deleteRecordsByCycles(surveyId, cycles, client)
  if (!A.isEmpty(recordUuids)) {
    await RecordPrintableExportShareService.deleteByRecordUuids({ surveyId, recordUuids }, client)
  }
  return recordUuids
}

/**
 * ======.
 * NODE
 * ======.
 */

// inserts/updates a node skipping record uniqueness validation
export const { updateNode } = NodeUpdateManager
export const { insertNode } = NodeCreationManager

// inserts/updates a node and validate records uniqueness
export const persistNode = (
  {
    user,
    survey,
    record,
    node,
    timezoneOffset,
    lang,
    appInfo,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    system = false,
    createMultipleEntities = true,
    clearNonApplicableValues = false,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    node: ArenaRecordNode
    timezoneOffset?: number | null
    lang?: string | null
    appInfo?: ArenaAppInfo
    nodesUpdateListener?: (nodes: NodesByUuid) => void
    nodesValidationListener?: (validation: ArenaValidation) => void
    system?: boolean
    createMultipleEntities?: boolean
    clearNonApplicableValues?: boolean
  },
  client: DbClient = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    {
      user,
      survey,
      record,
      node,
      timezoneOffset,
      lang,
      appInfo,
      clearNonApplicableValues,
      nodesUpdateFn: (user, survey, record, node, t) => {
        const nodeUuid = Node.getUuid(node)

        const existingNode = Record.getNodeByUuid(nodeUuid)(record)

        if (existingNode) {
          return NodeUpdateManager.updateNode({ user, survey, record, node, system }, t)
        }
        return NodeCreationManager.insertNode(
          { user, survey, record, node, system, createMultipleEntities, timezoneOffset, lang, appInfo },
          t
        )
      },
      nodesUpdateListener,
      nodesValidationListener,
    },
    client
  )

export const updateNodesDependents = NodeUpdateManager.updateNodesDependents
export const updateRequiredFlags = NodeUpdateManager.updateRequiredFlags

export const deleteNode = (
  {
    user,
    survey,
    record,
    nodeUuid,
    timezoneOffset,
    lang,
    appInfo,
    nodesUpdateListener = null,
    nodesValidationListener = null,
    clearNonApplicableValues = false,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    nodeUuid: string
    timezoneOffset?: number
    lang?: string
    appInfo?: ArenaAppInfo
    nodesUpdateListener?: (nodes: NodesByUuid) => void
    nodesValidationListener?: (validation: ArenaValidation) => void
    clearNonApplicableValues?: boolean
  },
  t: DbClient = db
) =>
  _updateNodeAndValidateRecordUniqueness(
    {
      user,
      survey,
      record,
      node: Record.getNodeByUuid(nodeUuid)(record),
      timezoneOffset,
      lang,
      appInfo,
      clearNonApplicableValues,
      nodesUpdateFn: (user, survey, record, node, t) =>
        NodeUpdateManager.deleteNode(user, survey, record, Node.getUuid(node), t),
      nodesUpdateListener,
      nodesValidationListener,
    },
    t
  )

/**
 * Evaluates again the expressions using the app info functions (appId, appVersion, appPlatform)
 * when the record has been modified last with another app (or app version) and stores the app info in the record.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user editing the record.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.record - The record.
 * @param {!object} params.appInfo - The app editing the record.
 * @param {number} [params.timezoneOffset] - The client timezone offset.
 * @param {string} [params.lang] - The language used to evaluate the expressions.
 * @param {Function} [params.nodesUpdateListener] - Listener notified with the updated nodes.
 * @param {Function} [params.nodesValidationListener] - Listener notified with the updated validations.
 * @param {object} [client] - The database client.
 * @returns {Promise<object>} - The updated record.
 */
export const updateAppInfoDependents = (
  {
    user,
    survey,
    record,
    appInfo,
    timezoneOffset,
    lang,
    nodesUpdateListener = null,
    nodesValidationListener = null,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    appInfo: ArenaAppInfo
    timezoneOffset?: number
    lang?: string
    nodesUpdateListener?: (nodes: NodesByUuid) => void
    nodesValidationListener?: (validation: ArenaValidation) => void
  },
  client: DbClient = db
): Promise<ArenaRecord> => {
  if (!Records.isAppInfoChanged(appInfo)(record)) return Promise.resolve(record)

  return client.tx(async (t) => {
    const info = { ...record.info, modifiedWith: appInfo }
    await RecordRepository.updateRecordInfo(
      { surveyId: Survey.getId(survey), recordUuid: Record.getUuid(record), info },
      t
    )
    let recordUpdated: ArenaRecord = { ...record, info }

    const appInfoDependentNodes: NodesByUuid = {}
    for (const nodeDef of Surveys.getAppInfoDependents({ survey })) {
      for (const node of Records.getNodesByDefUuid(nodeDef.uuid)(recordUpdated)) {
        appInfoDependentNodes[node.uuid] = node
      }
    }
    if (A.isEmpty(appInfoDependentNodes)) return recordUpdated

    const { record: recordWithDependents, nodes } = await _onNodesUpdate(
      {
        user,
        survey,
        record: recordUpdated,
        nodesUpdated: appInfoDependentNodes,
        timezoneOffset,
        lang,
        appInfo,
        clearNonApplicableValues: false,
        nodesUpdateListener,
        nodesValidationListener,
      },
      t
    )
    recordUpdated = recordWithDependents
    await _afterNodesUpdate({ survey, record: recordUpdated, nodes, nodesValidationListener }, t)
    return recordUpdated
  })
}

export const { deleteNodesByUuids } = NodeUpdateManager

export const deleteNodesByNodeDefUuids = (
  { user, surveyId, nodeDefUuids }: { user: ArenaUser; surveyId: number; nodeDefUuids: string[] },
  client: DbClient = db
) => NodeUpdateManager.deleteNodesByNodeDefUuids(user, surveyId, nodeDefUuids, client)

const _updateNodeAndValidateRecordUniqueness = (
  {
    user,
    survey,
    record,
    node,
    timezoneOffset,
    lang,
    appInfo,
    clearNonApplicableValues = false,
    nodesUpdateFn,
    nodesUpdateListener = null,
    nodesValidationListener = null,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    node: ArenaRecordNode
    timezoneOffset?: number
    lang: string
    appInfo?: ArenaAppInfo
    clearNonApplicableValues?: boolean
    nodesUpdateFn: (
      user: ArenaUser,
      survey: ArenaSurvey,
      record: ArenaRecord,
      node: ArenaRecordNode,
      t: DbClient
    ) => Promise<{ record: ArenaRecord; nodes?: NodesByUuid }>
    nodesUpdateListener?: (nodes: NodesByUuid) => void
    nodesValidationListener?: (validation: ArenaValidation) => void
  },
  client: DbClient = db
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
        lang,
        appInfo,
        clearNonApplicableValues,
        nodesUpdateListener,
        nodesValidationListener,
      },
      t
    )
    recordUpdated = recordUpdated2

    await _afterNodesUpdate(
      {
        survey,
        record: recordUpdated,
        nodes: updatedNodesAndDependents,
        nodesValidationListener,
      },
      t
    )

    return recordUpdated
  })

const _beforeNodeUpdate = async (
  { survey, record, node }: { survey: ArenaSurvey; record: ArenaRecord; node: ArenaRecordNode },
  t: DbClient
) => {
  if (Record.isPreview(record)) return

  const nodeDefUuid = Node.getNodeDefUuid(node)
  // Check if record key will be modified
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // validate records key and unique node values uniqueness
  const ancestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  if (!NodeDef.isRoot(ancestorMultipleEntity)) return

  if (NodeDef.isKey(nodeDef)) {
    // Validate record uniqueness of records with same record keys
    await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
      { survey, record, excludeRecordFromCount: true },
      t
    )
  } else if (NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef)) && NodeDef.isSingle(nodeDef)) {
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

const _getDependentNodesToValidate = ({
  survey,
  record,
  nodes,
}: {
  survey: ArenaSurvey
  record: ArenaRecord
  nodes: NodesByUuid
}) => {
  const dependentNodePointersToValidate: ArenaRecordNodePointer[] = []
  for (const node of Object.values(nodes)) {
    for (const dependencyType of validationDependencyTypes) {
      const dependentPointers = Records.getDependentNodePointers(survey, node, dependencyType, true)(record)
      dependentNodePointersToValidate.push(...dependentPointers)
    }
  }
  const dependentNodesToValidate = RecordNodePointers.getNodesFromNodePointers({
    record,
    nodePointers: dependentNodePointersToValidate,
  })
  return { ...nodes, ...ObjectUtils.toUuidIndexedObj(dependentNodesToValidate) }
}

const _onNodesUpdate = async (
  {
    user,
    survey,
    record,
    nodesUpdated,
    timezoneOffset,
    lang,
    appInfo,
    clearNonApplicableValues,
    nodesUpdateListener,
    nodesValidationListener,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    nodesUpdated: NodesByUuid
    timezoneOffset?: number
    lang: string
    appInfo?: ArenaAppInfo
    clearNonApplicableValues: boolean
    nodesUpdateListener: (nodes: NodesByUuid) => void
    nodesValidationListener: (validation: ArenaValidation) => void
  },
  t: DbClient
) => {
  // 1. update record and notify
  if (nodesUpdateListener) {
    nodesUpdateListener(nodesUpdated)
  }

  // 2. update dependent nodes
  const { record: recordUpdatedDependentNodes, nodes: updatedDependentNodes } =
    await NodeUpdateManager.updateNodesDependents(
      { user, survey, record, nodes: nodesUpdated, timezoneOffset, lang, appInfo, clearNonApplicableValues },
      t
    )
  if (nodesUpdateListener) {
    nodesUpdateListener(updatedDependentNodes)
  }

  record = recordUpdatedDependentNodes

  const updatedNodesAndDependents = { ...nodesUpdated, ...updatedDependentNodes }

  // 3. update node validations
  const nodesToValidate = _getDependentNodesToValidate({ survey, record, nodes: updatedNodesAndDependents })

  const recordUpdated = await validateNodesAndPersistToRDB(
    { user, survey, record, nodes: nodesToValidate, nodesValidationListener },
    t
  )
  return { record: recordUpdated, nodes: updatedNodesAndDependents }
}

const _afterNodesUpdate = async (
  {
    survey,
    record,
    nodes,
    nodesValidationListener = null,
  }: {
    survey: ArenaSurvey
    record: ArenaRecord
    nodes: NodesByUuid
    nodesValidationListener?: (validation: ArenaValidation) => void
  },
  t: DbClient
) => {
  if (Record.isPreview(record)) return

  const nodeDefsModified = Object.values(nodes).map((node) =>
    Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  )

  // Check if root keys have been modified
  const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
  if (nodeDefsModified.some((nodeDef) => rootKeyDefs.includes(nodeDef))) {
    // Validate record uniqueness of records with same record keys
    const validationByRecordUuid = await RecordValidationManager.validateRecordKeysUniquenessAndPersistValidation(
      { survey, record },
      t
    )
    const recordNodesValidation = validationByRecordUuid[Record.getUuid(record)]
    if (nodesValidationListener && !A.isEmpty(recordNodesValidation)) {
      nodesValidationListener(recordNodesValidation)
    }
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
  // for each modified node def, validate record uniqueness of records with same record unique nodes
  for (const nodeDefUnique of rootUniqueNodeDefsModified) {
    const validationByRecordUuid =
      /* NOSONAR */ await RecordValidationManager.validateRecordUniqueNodesUniquenessAndPersistValidation(
        { survey, record, nodeDefUniqueUuid: NodeDef.getUuid(nodeDefUnique), excludeRecordFromCount: false },
        t
      )
    const recordNodesValidation = validationByRecordUuid[Record.getUuid(record)]
    if (nodesValidationListener && !A.isEmpty(recordNodesValidation)) {
      nodesValidationListener(recordNodesValidation)
    }
  }
  const surveyId = Survey.getId(survey)
  const recordUuid = Record.getUuid(record)
  await RecordRepository.updateRecordDateModified({ surveyId, recordUuid }, t)
}

const validateNodesAndPersistToRDB = async (
  {
    user,
    survey,
    record,
    nodes,
    nodesValidationListener = null,
  }: {
    user: ArenaUser
    survey: ArenaSurvey
    record: ArenaRecord
    nodes: NodesByUuid
    nodesValidationListener?: (validation: ArenaValidation) => void
  },
  t: DbClient
) => {
  const nodesArray = Object.values(nodes)
  const nodesToValidate = nodesArray.reduce(
    (nodesAcc, node) => (Node.isDeleted(node) ? nodesAcc : { ...nodesAcc, [Node.getUuid(node)]: node }),
    {}
  )
  const { nodesValidation: validations } = await RecordValidationManager.validateNodesAndPersistValidation(
    { user, survey, record, nodes: nodesToValidate, validateRecordUniqueness: true },
    t
  )
  if (nodesValidationListener && !A.isEmpty(validations)) {
    nodesValidationListener(validations)
  }

  let recordUpdated = Record.mergeNodeValidations(validations)(record)

  if (!Record.isPreview(recordUpdated)) {
    recordUpdated = await NodeRdbManager.persistNodesToRDB({ survey, record: recordUpdated, nodesArray }, t)
  }
  return recordUpdated
}
