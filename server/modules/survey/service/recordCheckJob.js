import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as DbUtils from '@server/db/dbUtils'
import BatchPersister from '@server/db/batchPersister'
import Job from '@server/job/job'
import * as SurveyManager from '../manager/surveyManager'
import * as RecordManager from '../../record/manager/recordManager'

// Per-record/per-step tracing is too noisy to leave on for routine runs, but invaluable when a
// publish is slow or looks stuck. Flip to true to re-enable it.
const VERBOSE_LOGGING = false

export default class RecordCheckJob extends Job {
  constructor(params) {
    super(RecordCheckJob.type, params)

    this.surveyAndNodeDefsByCycle = {} // Cache of surveys and updated node defs by cycle
    this.nodesBatchInserter = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
    this.nodesBatchUpdater = new BatchPersister(this.nodesBatchUpdateHandler.bind(this), 2500)
    // Node defs (uuid -> { name, recordsAffectedCount }) whose value actually changed for at least
    // one existing node while recalculating default values/applicability - only populated when
    // context.recordValuesUpdateCheckEnabled is set (i.e. when running as part of a survey publish;
    // see SurveyPublishJob). Used to cancel an unconfirmed publish that would silently alter data
    // already recorded (see execute()).
    this.nodeDefUuidsWithValueChanges = new Map()
  }

  // Like logDebug, but silenced unless VERBOSE_LOGGING is on - use for per-record/per-step tracing
  // that would otherwise flood the logs on a survey with many records.
  logDebugOptional(...msgs) {
    if (VERBOSE_LOGGING) {
      this.logDebug(...msgs)
    }
  }

  async execute() {
    // Checking records against a large survey can make Postgres pick parallel query plans; parallel
    // workers only help fetching/validating a single record's data, which is already small, so
    // disable them for this job's transaction rather than requiring every deployment to raise its
    // shm-size (see DbUtils.disableParallelQueryForTransaction for why).
    await DbUtils.disableParallelQueryForTransaction(this.tx)

    this.logDebugOptional('fetching records uuids and cycles...')
    const recordsUuidAndCycle = await RecordManager.fetchRecordsUuidAndCycle({ surveyId: this.surveyId }, this.tx)

    this.total = R.length(recordsUuidAndCycle)
    this.logDebugOptional(`${this.total} records to check`)

    let index = 0
    for (const { uuid: recordUuid, cycle } of recordsUuidAndCycle) {
      const startTime = Date.now()

      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      await this._deleteNodesForDeletedNodeDefsOnce(surveyAndNodeDefs)

      const { requiresCheck } = surveyAndNodeDefs

      if (requiresCheck) {
        await this._checkRecord({ surveyAndNodeDefs, recordUuid })
      }

      this.logDebugOptional(
        `record ${index + 1}/${this.total} (uuid=${recordUuid}, cycle=${cycle}) checked in ${Date.now() - startTime}ms (requiresCheck=${requiresCheck})`
      )

      index++
      this.incrementProcessedItems()
    }

    // Cancel the publish if unconfirmed changes were found: whether a node def flagged as "updated"
    // actually changes any stored value can only be known by recalculating it (recalculation can
    // land back on the same value), so this can only be decided here, after checking every record -
    // not from the nodeDefUpdatedUuids classification alone.
    if (
      this.context.recordValuesUpdateCheckEnabled &&
      !this.context.updateRecordValues &&
      this.nodeDefUuidsWithValueChanges.size > 0
    ) {
      for (const { name, recordsAffectedCount } of this.nodeDefUuidsWithValueChanges.values()) {
        this.errors[name] = {
          key: 'jobs:recordCheckJobRecordValuesWillBeUpdated',
          params: { recordsAffectedCount },
        }
      }
      await this.setStatusFailed()
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
      this.logDebugOptional(`fetching survey for cycle ${cycle}...`)
      let survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId, cycle, draft: true, advanced: true, includeDeleted: true },
        tx
      )

      // 2. determine new, updated or deleted node defs
      const nodeDefAddedUuids = []
      const nodeDefUpdatedUuids = []
      // Node defs whose validations alone changed: these need records re-validated against the new
      // rules, but must NOT be treated as value-affecting (see below) - only applicable/default values/
      // file name expression changes can affect stored node values (and, for code attributes, cascade
      // into clearing dependent code attribute values). Folding a validations-only change (e.g. just
      // editing a validation message) into that same bucket was wiping dependent code attribute values
      // on every publish, even though the parent attribute's value never changed.
      const nodeDefValidationUpdatedUuids = []
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
            NodeDef.hasAdvancedPropsFileNameExpressionDraft(def))
        ) {
          // Already existing node def but applicable or default values or file name expression have been updated
          nodeDefUpdatedUuids.push(nodeDefUuid)
        } else if (NodeDef.hasAdvancedPropsDraft(def) && NodeDef.hasAdvancedPropsValidationsDraft(def)) {
          // Already existing node def but only validations have been updated
          nodeDefValidationUpdatedUuids.push(nodeDefUuid)
        }
      }

      const requiresCheck =
        cleanupRecords ||
        nodeDefAddedUuids.length +
          nodeDefUpdatedUuids.length +
          nodeDefValidationUpdatedUuids.length +
          nodeDefDeletedUuids.length >
          0

      result = {
        survey,
        nodeDefAddedUuids,
        nodeDefUpdatedUuids,
        nodeDefValidationUpdatedUuids,
        nodeDefDeletedUuids,
        requiresCheck,
        nodesForDeletedNodeDefsDeleted: false,
      }

      if (requiresCheck) {
        this.logDebugOptional('survey has been updated: record check necessary; fetching survey and ref data...')
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
        this.logDebugOptional('survey with ref data fetched')
      }
      this.surveyAndNodeDefsByCycle[cycle] = result
    }

    return result
  }

  // Deletes nodes belonging to deleted node defs once per cycle: the delete is survey-wide (not
  // scoped to a single record - see RecordManager.deleteNodesByNodeDefUuids), so running it again
  // for every one of potentially thousands of records would repeat the same full-table delete over
  // and over for no additional effect. The `nodesForDeletedNodeDefsDeleted` flag on the cached
  // surveyAndNodeDefs (shared across all records of the same cycle) guards that. Each record's own
  // check reflects this locally, from its own already-loaded nodes, rather than from anything
  // returned here (on a large survey this delete can match millions of rows - see
  // RecordManager.deleteNodesByNodeDefUuids for why we don't pull those back into memory).
  // One node def at a time (rather than a single IN (...) delete for all of them) so a failure or
  // a memory spike can be pinned to the specific node def responsible, from the logs.
  async _deleteNodesForDeletedNodeDefsOnce(surveyAndNodeDefs) {
    const { nodeDefDeletedUuids, nodesForDeletedNodeDefsDeleted } = surveyAndNodeDefs
    if (nodesForDeletedNodeDefsDeleted) return

    const { surveyId, tx } = this
    for (const nodeDefDeletedUuid of nodeDefDeletedUuids) {
      this.logDebugOptional(`deleting nodes for removed node def ${nodeDefDeletedUuid}...`)
      const deletedCount = await RecordManager.deleteNodesByNodeDefUuids(
        { user: this.user, surveyId, nodeDefUuids: [nodeDefDeletedUuid] },
        tx
      )
      this.logDebugOptional(`${deletedCount} nodes deleted for node def ${nodeDefDeletedUuid}`)
    }
    surveyAndNodeDefs.nodesForDeletedNodeDefsDeleted = true
  }

  async _checkRecord({ surveyAndNodeDefs, recordUuid }) {
    const { context, surveyId, user, tx } = this
    const {
      survey,
      nodeDefAddedUuids,
      nodeDefUpdatedUuids,
      nodeDefValidationUpdatedUuids,
      nodeDefDeletedUuids,
      allNotDeletedNodeDefUuids,
    } = surveyAndNodeDefs
    const { cleanupRecords } = context

    this.logDebugOptional(`checking record ${recordUuid}`)

    // 1. fetch record and nodes. Nodes belonging to deleted node defs are already gone at this point:
    // the survey-wide delete for this cycle ran earlier in the same transaction (see
    // _deleteNodesForDeletedNodeDefsOnce), and this fetch sees that transaction's own writes, so
    // there's nothing left here to additionally remove for nodeDefDeletedUuids.
    let record = await RecordManager.fetchRecordAndNodesByUuid(
      { surveyId, recordUuid, includeSurveyUuid: false, includeRecordUuid: false },
      tx
    )

    this.logDebugOptional(`record fetched (${Object.keys(Record.getNodes(record) ?? {}).length} nodes)`)

    const nodesInsertedByUuid = {}
    const allUpdatedNodesByUuid = {}

    // 3. insert missing nodes
    const nodeDefToCheckForMissingNodesUuids = cleanupRecords ? allNotDeletedNodeDefUuids : nodeDefAddedUuids
    if (nodeDefToCheckForMissingNodesUuids.length > 0) {
      this.logDebugOptional(`inserting missing nodes with node def uuids ${nodeDefToCheckForMissingNodesUuids}`)
      const { record: recordUpdateInsert, nodes: nodesUpdatedMissing = {} } = await this._insertMissingSingleNodes({
        survey,
        nodeDefUuids: nodeDefToCheckForMissingNodesUuids,
        record,
        sideEffect: true,
      })
      record = recordUpdateInsert || record
      Object.assign(nodesInsertedByUuid, nodesUpdatedMissing)
      Object.assign(allUpdatedNodesByUuid, nodesUpdatedMissing)
      this.logDebugOptional('missing nodes inserted')
    }

    // 4. apply default values and recalculate applicability
    const nodeDefAddedOrUpdatedUuidsUnique = new Set(R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids))
    for (const nodeInserted of Object.values(nodesInsertedByUuid)) {
      nodeDefAddedOrUpdatedUuidsUnique.add(Node.getNodeDefUuid(nodeInserted))
    }
    const nodeDefAddedOrUpdatedUuids = Array.from(nodeDefAddedOrUpdatedUuidsUnique)
    if (nodeDefAddedOrUpdatedUuids.length > 0) {
      this.logDebugOptional('applying default values')
      // Snapshot the values of already-existing nodes belonging to updated (not added) node defs,
      // so we can tell afterwards whether the recalculation actually changed anything - a node def
      // flagged as "updated" can still recalculate to the exact same value it already had.
      const valuesBeforeUpdateByNodeUuid = this.context.recordValuesUpdateCheckEnabled
        ? _snapshotNodeValues({ nodeDefUpdatedUuids, record, nodesInsertedByUuid })
        : null

      const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(
        survey,
        nodeDefAddedOrUpdatedUuids,
        record,
        nodesInsertedByUuid,
        tx
      )
      record = recordUpdate || record
      Object.assign(allUpdatedNodesByUuid, nodesUpdatedDefaultValues)

      if (valuesBeforeUpdateByNodeUuid) {
        this._trackNodeDefValueChanges({ survey, valuesBeforeUpdateByNodeUuid, nodesUpdatedDefaultValues })
      }
      this.logDebugOptional('default values applied')
    }

    // 4a. Persist nodes
    this.logDebugOptional(`persisting ${Object.keys(allUpdatedNodesByUuid).length} nodes`)
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

    // 6. validate nodes (also re-validate node defs whose validations alone changed, even though their
    // values were not recomputed above)
    const nodeDefToValidateUuidsUnique = new Set(R.concat(nodeDefAddedOrUpdatedUuids, nodeDefValidationUpdatedUuids))
    const nodeDefAddedOrUpdatedOrValidationUpdatedUuids = Array.from(nodeDefToValidateUuidsUnique)
    if (
      cleanupRecords ||
      !R.isEmpty(nodeDefAddedOrUpdatedOrValidationUpdatedUuids) ||
      !R.isEmpty(nodeDefDeletedUuids) ||
      !R.isEmpty(allUpdatedNodesByUuid)
    ) {
      const nodeDefUuidsToValidate = cleanupRecords
        ? allNotDeletedNodeDefUuids
        : nodeDefAddedOrUpdatedOrValidationUpdatedUuids
      this.logDebugOptional(`validating record ${recordUuid} (${nodeDefUuidsToValidate.length} node defs)`)
      await _validateNodes(
        { user, survey, nodeDefUuids: nodeDefUuidsToValidate, record, nodes: allUpdatedNodesByUuid },
        this.tx
      )
    }
    this.logDebugOptional('record check complete')
  }

  // Inserts all the missing single nodes in the specified records having the node def in the specified ones.
  // Returns an indexed object with all the inserted nodes.
  async _insertMissingSingleNodes({ survey, nodeDefUuids, record, sideEffect = false }) {
    const nodesUpdated = {}
    let recordUpdated = { ...record }
    for (const nodeDefUuid of nodeDefUuids) {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const parentNodeDefUuid = NodeDef.getParentUuid(nodeDef)
      const parentNodes = Record.getNodesByDefUuid(parentNodeDefUuid)(recordUpdated)
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

  // Compares each updated node's new value against the pre-update snapshot and records, per node
  // def, how many nodes actually changed value (as opposed to only recalculating to the same value).
  _trackNodeDefValueChanges({ survey, valuesBeforeUpdateByNodeUuid, nodesUpdatedDefaultValues }) {
    for (const [nodeUuid, valueBeforeUpdate] of valuesBeforeUpdateByNodeUuid) {
      const nodeUpdated = nodesUpdatedDefaultValues[nodeUuid]
      if (!nodeUpdated || R.equals(Node.getValue(nodeUpdated), valueBeforeUpdate)) continue

      const nodeDefUuid = Node.getNodeDefUuid(nodeUpdated)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const entry = this.nodeDefUuidsWithValueChanges.get(nodeDefUuid) ?? {
        name: NodeDef.getName(nodeDef),
        recordsAffectedCount: 0,
      }
      entry.recordsAffectedCount += 1
      this.nodeDefUuidsWithValueChanges.set(nodeDefUuid, entry)
    }
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

// Snapshots the current value of every already-existing node (i.e. not one just inserted this pass)
// belonging to one of the given (already-published, value-affecting) node defs. Values are deep-cloned:
// the recalculation below runs with sideEffect: true and can mutate a node's value object in place, so a
// bare reference here would silently "follow" that mutation and make every comparison see no change.
const _snapshotNodeValues = ({ nodeDefUpdatedUuids, record, nodesInsertedByUuid }) => {
  const valuesByNodeUuid = new Map()
  for (const nodeDefUuid of nodeDefUpdatedUuids) {
    const nodes = Record.getNodesByDefUuid(nodeDefUuid)(record)
    for (const node of nodes) {
      const nodeUuid = Node.getUuid(node)
      if (!nodesInsertedByUuid[nodeUuid]) {
        valuesByNodeUuid.set(nodeUuid, R.clone(Node.getValue(node)))
      }
    }
  }
  return valuesByNodeUuid
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefUpdatedUuids, record, newNodes, tx) => {
  const nodesToUpdate = { ...newNodes }

  // Include nodes associated to updated node defs
  for (const nodeDefUpdatedUuid of nodeDefUpdatedUuids) {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(nodeDefUpdatedUuid)(record)
    for (const nodeUpdated of nodesToUpdatePartial) {
      nodesToUpdate[Node.getUuid(nodeUpdated)] = nodeUpdated
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
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    }
  }
  // Record keys uniqueness must be validated after RDB generation
  await RecordManager.validateNodesAndPersistValidation({ user, survey, record, nodes: nodesToValidate }, tx)
}

RecordCheckJob.type = 'RecordCheckJob'
