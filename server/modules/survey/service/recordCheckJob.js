import * as R from 'ramda'

import { SRSs } from '@openforis/arena-core'

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
    this.nodesBatchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
  }

  async onStart() {
    super.onStart()
    await SRSs.init()
  }

  async execute() {
    const recordsUuidAndCycle = await RecordManager.fetchRecordsUuidAndCycle(this.surveyId, this.tx)

    this.total = R.length(recordsUuidAndCycle)

    await PromiseUtils.each(recordsUuidAndCycle, async ({ uuid: recordUuid, cycle }) => {
      const surveyAndNodeDefs = await this._getOrFetchSurveyAndNodeDefsByCycle(cycle)

      const { noUpdates } = surveyAndNodeDefs

      if (!noUpdates) {
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

      surveyAndNodeDefs = {
        survey,
        nodeDefAddedUuids,
        nodeDefUpdatedUuids,
        nodeDefDeletedUuids,
        noUpdates: [...nodeDefAddedUuids, ...nodeDefUpdatedUuids, ...nodeDefDeletedUuids].length === 0,
      }
      this.surveyAndNodeDefsByCycle[cycle] = surveyAndNodeDefs
    }

    return surveyAndNodeDefs
  }

  async _checkRecord(surveyAndNodeDefs, recordUuid) {
    const { survey, nodeDefAddedUuids, nodeDefUpdatedUuids, nodeDefDeletedUuids } = surveyAndNodeDefs

    // 1. fetch record and nodes
    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId: this.surveyId, recordUuid }, this.tx)

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

    const nodesToValidate = {}
    let missingNodes = {}

    // 3. insert missing nodes
    if (!R.isEmpty(nodeDefAddedUuids)) {
      const { record: recordUpdateInsert, nodes: missingNodesInserted = {} } = await this._insertMissingSingleNodes({
        survey,
        nodeDefAddedUuids,
        record,
      })
      record = recordUpdateInsert || record
      missingNodes = missingNodesInserted
      Object.assign(nodesToValidate, missingNodesInserted)
    }

    // 4. apply default values and recalculate applicability
    if (!R.isEmpty(nodeDefUpdatedUuids) || !R.isEmpty(missingNodes)) {
      const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(
        survey,
        nodeDefUpdatedUuids,
        record,
        missingNodes,
        this.tx
      )
      record = recordUpdate || record
      Object.assign(nodesToValidate, nodesUpdatedDefaultValues)
    }

    // 5. clear record keys validation (record keys validation performed after RDB generation)
    record = _clearRecordKeysValidation(record)

    // 6. validate nodes
    const newNodes = nodeDefAddedUuids.reduce((nodesByUuid, nodeDefUuid) => {
      const nodes = Record.getNodesByDefUuid(nodeDefUuid)(record)
      return { ...nodesByUuid, ...ObjectUtils.toUuidIndexedObj(nodes) }
    }, {})

    Object.assign(nodesToValidate, newNodes)

    const nodeDefAddedOrUpdatedUuids = R.concat(nodeDefAddedUuids, nodeDefUpdatedUuids)
    if (nodeDefAddedOrUpdatedUuids.length > 0 || !R.isEmpty(nodesToValidate)) {
      await _validateNodes(survey, nodeDefAddedOrUpdatedUuids, record, nodesToValidate, this.tx)
    }
  }

  /**
   * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
   *
   * Returns an indexed object with all the inserted nodes.
   *
   * @param root0
   * @param root0.survey
   * @param root0.nodeDefAddedUuids
   * @param root0.record
   */
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
    const nodesAddedArray = Object.values(nodesUpdated).filter(Node.isCreated)
    await PromiseUtils.each(nodesAddedArray, async (node) => {
      this.nodesBatchPersister.addItem(node, this.tx)
    })

    return { record: recordUpdated, nodes: nodesUpdated }
  }

  async nodesBatchInsertHandler(nodesArray, tx) {
    await RecordManager.insertNodesInBulk({ user: this.user, surveyId: this.surveyId, nodesArray }, tx)
  }

  async beforeSuccess() {
    super.beforeSuccess()
    await this.nodesBatchPersister.flush(this.tx)
  }
}

/**
 * Inserts a missing single node in a specified parent node.
 *
 * Returns an indexed object with all the inserted nodes.
 *
 * @param survey
 * @param childDef
 * @param record
 * @param parentNode
 * @param user
 * @param tx
 */
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

  return RecordManager.updateNodesDependents(survey, record, nodesToUpdate, tx)
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
  nodeDefAddedUpdatedUuids.forEach((nodeDefUuid) => {
    const def = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    parentNodes.forEach((parentNode) => {
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    })
  })

  // Record keys uniqueness must be validated after RDB generation

  await RecordManager.validateNodesAndPersistValidation(survey, record, nodesToValidate, false, tx)
}

RecordCheckJob.type = 'RecordCheckJob'
