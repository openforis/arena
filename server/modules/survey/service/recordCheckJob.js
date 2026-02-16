import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

import BatchPersister from '@server/db/batchPersister'
import Job from '@server/job/job'
import * as SurveyManager from '../manager/surveyManager'
import * as RecordManager from '../../record/manager/recordManager'

export default class RecordCheckJob extends Job {
  constructor(params) {
    super(RecordCheckJob.type, params)

    this.surveyAndNodeDefsByCycle = {} // Cache of surveys and updated node defs by cycle
    this.nodesBatchInserter = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
    this.nodesBatchUpdater = new BatchPersister(this.nodesBatchUpdateHandler.bind(this), 2500)
  }

  async execute() {
    const recordsUuidAndCycle = await RecordManager.fetchRecordsUuidAndCycle({ surveyId: this.surveyId }, this.tx)

    this.total = R.length(recordsUuidAndCycle)

    for (const { uuid: recordUuid, cycle } of recordsUuidAndCycle) {
      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      const { requiresCheck } = surveyAndNodeDefs

      if (requiresCheck) {
        await this._checkRecord({ surveyAndNodeDefs, recordUuid })
      }

      this.incrementProcessedItems()
    }
  }

  _cleanSurveysCache(cycleToKeep) {
    const cycles = Object.keys(this.surveyAndNodeDefsByCycle)
    for (const cycleInCache of cycles) {
      if (cycleInCache !== cycleToKeep) {
        delete this.surveyAndNodeDefsByCycle[cycleInCache]
      }
    }
  }

  async _getOrFetchSurveyAndNodeDefsByCycle(cycle) {
    const { context, surveyId, tx } = this
    const { cleanupRecords } = context
    this._cleanSurveysCache(cycle)
    let result = this.surveyAndNodeDefsByCycle[cycle]
    if (!result) {
      // 1. fetch survey
      this.logDebug(`fetching survey for cycle ${cycle}...`)
      let survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId, cycle, draft: true, advanced: true, includeDeleted: true },
        tx
      )

      // 2. determine new, updated or deleted node defs
      const nodeDefAddedUuids = []
      const nodeDefUpdatedUuids = []
      const nodeDefDeletedUuids = []

      const nodeDefs = Survey.getNodeDefsArray(survey)
      for (const def of nodeDefs) {
        const nodeDefUuid = NodeDef.getUuid(def)
        if (NodeDef.isDeleted(def)) {
          nodeDefDeletedUuids.push(nodeDefUuid)
        } else if (!NodeDef.isPublished(def)) {
          // New node def
          nodeDefAddedUuids.push(nodeDefUuid)
        } else if (
          NodeDef.hasAdvancedPropsDraft(def) &&
          (NodeDef.hasAdvancedPropsApplicableDraft(def) ||
            NodeDef.hasAdvancedPropsDefaultValuesDraft(def) ||
            NodeDef.hasAdvancedPropsFileNameExpressionDraft(def) ||
            NodeDef.hasAdvancedPropsValidationsDraft(def))
        ) {
          // Already existing node def but applicable or default values or validations have been updated
          nodeDefUpdatedUuids.push(nodeDefUuid)
        }
      }

      const requiresCheck =
        cleanupRecords || nodeDefAddedUuids.length + nodeDefUpdatedUuids.length + nodeDefDeletedUuids.length > 0

      result = { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids, requiresCheck }

      if (requiresCheck) {
        this.logDebug('survey has been updated: record check necessary; fetching survey and ref data...')
        // fetch survey reference data (used later for record validation)
        survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
          { surveyId, cycle, draft: true, advanced: true, includeDeleted: true },
          tx
        )
        result.survey = survey

        // get all not deleted node defs uuids (used for cleanupRecords)
        const allNotDeletedNodeDefs = Survey.getNodeDefsArray(survey).filter((def) => !NodeDef.isDeleted(def))
        const allNotDeletedNodeDefUuids = allNotDeletedNodeDefs.map(NodeDef.getUuid)
        result.allNotDeletedNodeDefUuids = allNotDeletedNodeDefUuids
        this.logDebug('survey with ref data fetched')
      }
      this.surveyAndNodeDefsByCycle[cycle] = result
    }

    return result
  }

  async _checkRecord({ surveyAndNodeDefs, recordUuid }) {
    const { context, surveyId, user, tx } = this
    const { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids, allNotDeletedNodeDefUuids } =
      surveyAndNodeDefs
    const { cleanupRecords } = context

    // this.logDebug(`checking record ${recordUuid}`)

    // 1. fetch record and nodes
    let record = await RecordManager.fetchRecordAndNodesByUuid(
      { surveyId, recordUuid, includeSurveyUuid: false, includeRecordUuid: false },
      tx
    )

    // this.logDebug(`record fetched`)

    // 2. remove deleted nodes
    if (!R.isEmpty(nodeDefDeletedUuids)) {
      // this.logDebug(`remove deleted nodes`)
      const recordDeletedNodes = await RecordManager.deleteNodesByNodeDefUuids(
        { user, surveyId, nodeDefUuids: nodeDefDeletedUuids, record },
        tx
      )
      record = recordDeletedNodes || record

      // this.logDebug(`nodes deleted`)
    }

    const nodesInsertedByUuid = {}
    const allUpdatedNodesByUuid = {}

    // 3. insert missing nodes
    const nodeDefToCheckForMissingNodesUuids = cleanupRecords ? allNotDeletedNodeDefUuids : nodeDefAddedUuids
    if (nodeDefToCheckForMissingNodesUuids.length > 0) {
      // this.logDebug(`inserting missing nodes with node def uuids ${nodeDefToCheckForMissingNodesUuids}`)
      const { record: recordUpdateInsert, nodes: nodesUpdatedMissing = {} } = await this._insertMissingSingleNodes({
        survey,
        nodeDefUuids: nodeDefToCheckForMissingNodesUuids,
        record,
        sideEffect: true,
      })
      record = recordUpdateInsert || record
      Object.assign(nodesInsertedByUuid, nodesUpdatedMissing)
      Object.assign(allUpdatedNodesByUuid, nodesUpdatedMissing)
      // this.logDebug('missing nodes inserted')
    }

    // 4. apply default values and recalculate applicability
    const nodeDefAddedOrUpdatedUuids = R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids)

    if (!R.isEmpty(nodeDefUpdatedUuids) || !R.isEmpty(nodesInsertedByUuid)) {
      // this.logDebug('applying default values')
      const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(
        survey,
        nodeDefAddedOrUpdatedUuids,
        record,
        nodesInsertedByUuid,
        tx
      )
      record = recordUpdate || record
      Object.assign(allUpdatedNodesByUuid, nodesUpdatedDefaultValues)
    }

    // 4a. Persist nodes
    // this.logDebug('persisting nodes')
    const allUpdatedNodesArray = Object.values(allUpdatedNodesByUuid)
    for (const node of allUpdatedNodesArray) {
      if (Node.isCreated(node)) {
        await this.nodesBatchInserter.addItem(node, tx)
      } else if (Node.isUpdated(node)) {
        await this.nodesBatchUpdater.addItem(node, tx)
      }
    }

    // 5. clear record keys validation (record keys validation performed after RDB generation)
    record = _clearRecordKeysValidation(record)

    // 6. validate nodes
    const newNodes = nodeDefAddedUuids.reduce((nodesByUuid, nodeDefUuid) => {
      const nodes = Record.getNodesByDefUuid(nodeDefUuid)(record)
      return Object.assign(nodesByUuid, ObjectUtils.toUuidIndexedObj(nodes))
    }, {})

    Object.assign(allUpdatedNodesByUuid, newNodes)

    if (
      !R.isEmpty(nodeDefAddedOrUpdatedUuids) ||
      !R.isEmpty(nodeDefDeletedUuids) ||
      !R.isEmpty(allUpdatedNodesByUuid)
    ) {
      const nodeDefUuidsToValidate = cleanupRecords ? allNotDeletedNodeDefUuids : nodeDefAddedOrUpdatedUuids
      // this.logDebug(`validating record ${recordUuid}`)
      await _validateNodes(
        { user, survey, nodeDefUuids: nodeDefUuidsToValidate, record, nodes: allUpdatedNodesByUuid },
        this.tx
      )
    }
    // this.logDebug('record check complete')
  }

  // Inserts all the missing single nodes in the specified records having the node def in the specified ones.
  // Returns an indexed object with all the inserted nodes.
  async _insertMissingSingleNodes({ survey, nodeDefUuids, record, sideEffect = false }) {
    const nodesUpdated = {}
    let recordUpdated = { ...record }
    for (const nodeDefUuid of nodeDefUuids) {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(recordUpdated)
      for (const parentNode of parentNodes) {
        const { record: recordUpdatedNodeInsert, nodes } = await _insertMissingSingleNode({
          survey,
          childDef: nodeDef,
          record: recordUpdated,
          parentNode,
          user: this.user,
          tx: this.tx,
          sideEffect,
        })
        Object.assign(nodesUpdated, nodes)
        recordUpdated = recordUpdatedNodeInsert || recordUpdated
      }
    }
    return { record: recordUpdated, nodes: nodesUpdated }
  }

  async nodesBatchInsertHandler(nodesArray, tx) {
    const { user, surveyId } = this
    await RecordManager.insertNodesInBulk({ user, surveyId, nodesArray }, tx)
  }

  async nodesBatchUpdateHandler(nodesArray, tx) {
    const { user, surveyId } = this
    await RecordManager.updateNodes({ user, surveyId, nodes: nodesArray }, tx)
  }

  async beforeSuccess() {
    super.beforeSuccess()
    await this.nodesBatchInserter.flush(this.tx)
    await this.nodesBatchUpdater.flush(this.tx)
  }
}

// Inserts a missing single node in a specified parent node.
// Returns an indexed object with all the inserted nodes.
const _insertMissingSingleNode = async ({ survey, childDef, record, parentNode, user, tx, sideEffect = false }) => {
  if (!NodeDef.isSingle(childDef)) {
    // multiple node: don't insert it
    return {}
  }
  const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
  if (!R.isEmpty(children)) {
    // single node already inserted
    return {}
  }
  // insert missing single node
  const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)
  return RecordManager.insertNode(
    { user, survey, record, node: childNode, system: true, persistNodes: false, sideEffect },
    tx
  )
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefUpdatedUuids, record, newNodes, tx) => {
  const nodesToUpdate = { ...newNodes }

  // Include nodes associated to updated node defs
  for (const nodeDefUpdatedUuid of nodeDefUpdatedUuids) {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(nodeDefUpdatedUuid)(record)
    for (const nodeUpdated of nodesToUpdatePartial) {
      nodesToUpdate[Node.getIId(nodeUpdated)] = nodeUpdated
    }
  }

  return RecordManager.updateNodesDependents(
    { survey, record, nodes: nodesToUpdate, persistNodes: false, sideEffect: true },
    tx
  )
}

const _clearRecordKeysValidation = (record) => {
  const validationRecord = Record.getValidation(record)

  const validationNodes = Object.values(Validation.getFieldValidations(validationRecord))
  for (const validationNode of validationNodes) {
    Objects.dissocPath({
      obj: validationNode,
      path: [Validation.keys.fields, RecordValidation.keys.recordKeys],
      sideEffect: true,
    })
  }
  return record
}

const _validateNodes = async ({ user, survey, nodeDefUuids, record, nodes }, tx) => {
  const nodesToValidate = { ...nodes }

  // Include parent nodes of new/updated node defs (needed for min/max count validation)
  for (const nodeDefUuid of nodeDefUuids) {
    const def = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    for (const parentNode of parentNodes) {
      nodesToValidate[Node.getIId(parentNode)] = parentNode
    }
  }

  // Record keys uniqueness must be validated after RDB generation
  await RecordManager.validateNodesAndPersistValidation({ user, survey, record, nodes: nodesToValidate }, tx)
}

RecordCheckJob.type = 'RecordCheckJob'
