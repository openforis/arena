import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

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

    await PromiseUtils.each(recordsUuidAndCycle, async ({ uuid: recordUuid, cycle }) => {
      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      const { requiresCheck } = surveyAndNodeDefs

      if (requiresCheck) {
        await this._checkRecord(surveyAndNodeDefs, recordUuid)
      }

      this.incrementProcessedItems()
    })
  }

  _cleanSurveysCache(cycleToKeep) {
    Object.keys(this.surveyAndNodeDefsByCycle).forEach((cycleInCache) => {
      if (cycleInCache !== cycleToKeep) {
        delete this.surveyAndNodeDefsByCycle[cycleInCache]
      }
    })
  }

  async _getOrFetchSurveyAndNodeDefsByCycle(cycle) {
    this._cleanSurveysCache(cycle)
    let surveyAndNodeDefs = this.surveyAndNodeDefsByCycle[cycle]
    if (!surveyAndNodeDefs) {
      // 1. fetch survey
      this.logDebug(`fetching survey for cycle ${cycle}...`)
      let survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId: this.surveyId, cycle, draft: true, advanced: true, includeDeleted: true },
        this.tx
      )

      // 2. determine new, updated or deleted node defs
      const nodeDefAddedUuids = []
      const nodeDefUpdatedUuids = []
      const nodeDefDeletedUuids = []

      Survey.getNodeDefsArray(survey).forEach((def) => {
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
            NodeDef.hasAdvancedPropsValidationsDraft(def))
        ) {
          // Already existing node def but applicable or default values or validations have been updated
          nodeDefUpdatedUuids.push(nodeDefUuid)
        }
      })

      const requiresCheck = nodeDefAddedUuids.length + nodeDefUpdatedUuids.length + nodeDefDeletedUuids.length > 0
      if (requiresCheck) {
        this.logDebug('survey has been updated: record check necessary; fetching survey and ref data...')
        // fetch survey reference data (used later for record validation)
        survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
          { surveyId: this.surveyId, cycle, draft: true, advanced: true, includeDeleted: true },
          this.tx
        )
        this.logDebug('survey fetched')
      }
      surveyAndNodeDefs = {
        survey,
        nodeDefAddedUuids,
        nodeDefUpdatedUuids,
        nodeDefDeletedUuids,
        requiresCheck,
      }
      this.surveyAndNodeDefsByCycle[cycle] = surveyAndNodeDefs
    }

    return surveyAndNodeDefs
  }

  async _checkRecord(surveyAndNodeDefs, recordUuid) {
    const { surveyId, user, tx } = this
    const { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids } = surveyAndNodeDefs

    // this.logDebug(`checking record ${recordUuid}`)

    // 1. fetch record and nodes
    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)

    // 2. remove deleted nodes
    if (!R.isEmpty(nodeDefDeletedUuids)) {
      const recordDeletedNodes = await RecordManager.deleteNodesByNodeDefUuids(
        this.user,
        this.surveyId,
        nodeDefDeletedUuids,
        record,
        tx
      )
      record = recordDeletedNodes || record
    }

    const nodesInsertedByUuid = {}
    const allUpdatedNodesByUuid = {}

    // 3. insert missing nodes
    if (!R.isEmpty(nodeDefAddedUuids)) {
      const { record: recordUpdateInsert, nodes: nodesUpdatedMissing = {} } = await this._insertMissingSingleNodes({
        survey,
        nodeDefAddedUuids,
        record,
      })
      record = recordUpdateInsert || record
      Object.assign(nodesInsertedByUuid, nodesUpdatedMissing)
      Object.assign(allUpdatedNodesByUuid, nodesUpdatedMissing)
    }

    // 4. apply default values and recalculate applicability
    const nodeDefAddedOrUpdatedUuids = R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids)

    if (!R.isEmpty(nodeDefUpdatedUuids) || !R.isEmpty(nodesInsertedByUuid)) {
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
    const allUpdatedNodesArray = Object.values(allUpdatedNodesByUuid)
    for await (const node of allUpdatedNodesArray) {
      if (Node.isCreated(node)) {
        this.nodesBatchInserter.addItem(node, tx)
      } else if (Node.isUpdated(node)) {
        this.nodesBatchUpdater.addItem(node, tx)
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

    if (nodeDefAddedOrUpdatedUuids.length > 0 || !R.isEmpty(allUpdatedNodesByUuid)) {
      // this.logDebug(`validating record ${recordUuid}`)
      await _validateNodes({ user, survey, nodeDefAddedOrUpdatedUuids, record, nodes: allUpdatedNodesByUuid }, this.tx)
    }
    // this.logDebug('record check complete')
  }

  // Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
  // Returns an indexed object with all the inserted nodes.
  async _insertMissingSingleNodes({ survey, nodeDefAddedUuids, record }) {
    const nodesUpdated = {}
    let recordUpdated = { ...record }
    await PromiseUtils.each(nodeDefAddedUuids, async (nodeDefUuid) => {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(recordUpdated)
      await PromiseUtils.each(parentNodes, async (parentNode) => {
        const { record: recordUpdatedNodeInsert, nodes } = await _insertMissingSingleNode(
          survey,
          nodeDef,
          recordUpdated,
          parentNode,
          this.user,
          this.tx
        )
        Object.assign(nodesUpdated, nodes)
        recordUpdated = recordUpdatedNodeInsert || recordUpdated
      })
    })
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
const _insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
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
  return RecordManager.insertNode({ user, survey, record, node: childNode, system: true, persistNodes: false }, tx)
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefUpdatedUuids, record, newNodes, tx) => {
  const nodesToUpdate = {
    ...newNodes,
  }

  // Include nodes associated to updated node defs
  nodeDefUpdatedUuids.forEach((nodeDefUpdatedUuid) => {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(nodeDefUpdatedUuid)(record)
    nodesToUpdatePartial.forEach((nodeUpdated) => {
      nodesToUpdate[Node.getUuid(nodeUpdated)] = nodeUpdated
    })
  })

  return RecordManager.updateNodesDependents(
    { survey, record, nodes: nodesToUpdate, perstistNodes: false, sideEffect: true },
    tx
  )
}

const _clearRecordKeysValidation = (record) => {
  const validationRecord = Record.getValidation(record)

  const validationNodes = Object.values(Validation.getFieldValidations(validationRecord))
  validationNodes.forEach((validationNode) => {
    Objects.dissocPath({
      obj: validationNode,
      path: [Validation.keys.fields, RecordValidation.keys.recordKeys],
      sideEffect: true,
    })
  })
  return record
}

const _validateNodes = async ({ user, survey, nodeDefAddedOrUpdatedUuids, record, nodes }, tx) => {
  const nodesToValidate = {
    ...nodes,
  }

  // Include parent nodes of new/updated node defs (needed for min/max count validation)
  nodeDefAddedOrUpdatedUuids.forEach((nodeDefUuid) => {
    const def = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    parentNodes.forEach((parentNode) => {
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    })
  })

  // Record keys uniqueness must be validated after RDB generation
  await RecordManager.validateNodesAndPersistValidation({ user, survey, record, nodes: nodesToValidate }, tx)
}

RecordCheckJob.type = 'RecordCheckJob'
