import * as R from 'ramda'

import { SRSs } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as SurveyManager from '../manager/surveyManager'
import * as RecordManager from '../../record/manager/recordManager'

export default class RecordCheckJob extends Job {
  constructor(params) {
    super(RecordCheckJob.type, params)

    this.surveyAndNodeDefsByCycle = {} // Cache of surveys and updated node defs by cycle
  }

  async onStart() {
    super.onStart()
    await SRSs.init()
  }

  async execute() {
    const recordsUuidAndCycle = await RecordManager.fetchRecordsUuidAndCycle(this.surveyId, this.tx)

    this.total = R.length(recordsUuidAndCycle)

    for (const { uuid: recordUuid, cycle } of recordsUuidAndCycle) {
      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      await this._checkRecord(surveyAndNodeDefs, recordUuid)

      this.incrementProcessedItems()
    }
  }

  async _getOrFetchSurveyAndNodeDefsByCycle(cycle) {
    let surveyAndNodeDefs = this.surveyAndNodeDefsByCycle[cycle]
    if (!surveyAndNodeDefs) {
      // 1. fetch survey
      const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
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
        } else if (NodeDef.hasAdvancedPropsDraft(def)) {
          // Already existing node def but validations have been updated
          nodeDefUpdatedUuids.push(nodeDefUuid)
        }
      })

      surveyAndNodeDefs = {
        survey,
        nodeDefAddedUuids,
        nodeDefUpdatedUuids,
        nodeDefDeletedUuids,
      }
      this.surveyAndNodeDefsByCycle[cycle] = surveyAndNodeDefs
    }

    return surveyAndNodeDefs
  }

  async _checkRecord(surveyAndNodeDefs, recordUuid) {
    const { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids } = surveyAndNodeDefs

    if (R.all(R.isEmpty)([nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids])) {
      return
    } // Nothing to update

    // 1. fetch record and nodes
    let record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, true, this.tx)

    // 2. remove deleted nodes
    if (!R.isEmpty(nodeDefDeletedUuids)) {
      const recordDeletedNodes = await RecordManager.deleteNodesByNodeDefUuids(
        this.user,
        this.surveyId,
        nodeDefDeletedUuids,
        record,
        this.tx
      )
      record = recordDeletedNodes || record
    }

    // 3. insert missing nodes
    const { record: recordUpdateInsert, nodes: missingNodes = {} } = await _insertMissingSingleNodes(
      survey,
      nodeDefAddedUuids,
      record,
      this.user,
      this.tx
    )
    record = recordUpdateInsert || record

    // 4. apply default values and recalculate applicability
    const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(
      survey,
      nodeDefUpdatedUuids,
      record,
      missingNodes,
      this.tx
    )
    record = recordUpdate || record

    // 5. clear record keys validation (record keys validation performed after RDB generation)
    record = _clearRecordKeysValidation(record)

    // 6. validate nodes

    const nodesToValidate = {
      ...missingNodes,
      ...nodesUpdatedDefaultValues,
    }

    await _validateNodes(survey, R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids), record, nodesToValidate, this.tx)
  }
}

/**
 * Inserts a missing single node in a specified parent node.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const _insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  if (NodeDef.isSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)
      return await RecordManager.insertNode(user, survey, record, childNode, true, tx)
    }
  }

  return {}
}

/**
 * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const _insertMissingSingleNodes = async (survey, nodeDefAddedUuids, record, user, tx) => {
  const nodesAdded = {}
  for (const nodeDefUuid of nodeDefAddedUuids) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(record)
    for (const parentNode of parentNodes) {
      Object.assign(nodesAdded, await _insertMissingSingleNode(survey, nodeDef, record, parentNode, user, tx))
    }
  }

  return nodesAdded
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefUpdatedUuids, record, newNodes, tx) => {
  const nodesToUpdate = {
    ...newNodes,
  }

  // Include nodes associated to updated node defs
  for (const nodeDefUpdatedUuid of nodeDefUpdatedUuids) {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(nodeDefUpdatedUuid)(record)
    for (const nodeUpdated of nodesToUpdatePartial) {
      nodesToUpdate[Node.getUuid(nodeUpdated)] = nodeUpdated
    }
  }

  return await RecordManager.updateNodesDependents(survey, record, nodesToUpdate, tx)
}

const _clearRecordKeysValidation = (record) => {
  const validationRecord = Record.getValidation(record)

  return R.pipe(
    Validation.getFieldValidations,
    Object.entries,
    R.reduce(
      (validationAcc, [nodeUuid, validationNode]) =>
        R.assoc(
          nodeUuid,
          Validation.dissocFieldValidation(RecordValidation.keys.recordKeys)(validationNode)
        )(validationAcc),
      {}
    ),
    (fieldValidationsUpdated) => Validation.setFieldValidations(fieldValidationsUpdated)(validationRecord),
    (validationRecordUpdated) => Validation.assocValidation(validationRecordUpdated)(record)
  )(validationRecord)
}

const _validateNodes = async (survey, nodeDefAddedUpdatedUuids, record, nodes, tx) => {
  const nodesToValidate = {
    ...nodes,
  }

  // Include parent nodes of new/updated node defs (needed for min/max count validation)
  for (const nodeDefUuid of nodeDefAddedUpdatedUuids) {
    const def = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    for (const parentNode of parentNodes) {
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    }
  }

  // Record keys uniqueness must be validated after RDB generation
  await RecordManager.validateNodesAndPersistValidation(survey, record, nodesToValidate, false, tx)
}

RecordCheckJob.type = 'RecordCheckJob'
