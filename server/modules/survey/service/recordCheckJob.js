const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const SurveyManager = require('../manager/surveyManager')
const RecordManager = require('../../record/manager/recordManager')

const Job = require('../../../job/job')

class RecordCheckJob extends Job {

  constructor (params) {
    super(RecordCheckJob.type, params)
  }

  async execute (tx) {
    //1. determine new or updated node defs

    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, tx)

    const nodeDefsNew = []
    const nodeDefsUpdated = []

    Survey.getNodeDefsArray(survey).forEach(def => {
      if (!NodeDef.isPublished(def)) {
        // new node def
        nodeDefsNew.push(def)
      } else if (NodeDef.hasAdvancedPropsDraft(def)) {
        // already existing node def but validations have been updated
        nodeDefsUpdated.push(def)
      }
    })

    if (!R.isEmpty(nodeDefsNew) || !R.isEmpty(nodeDefsUpdated)) {
      // 2. for each record, perform record check

      const recordUuids = await RecordManager.fetchRecordUuids(surveyId, tx)

      this.total = R.length(recordUuids)

      for (const recordUuid of recordUuids) {
        const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, true, tx)
        await this._checkRecord(survey, nodeDefsNew, nodeDefsUpdated, record, tx)

        this.incrementProcessedItems()
      }
    }
  }

  async _checkRecord (survey, nodeDefsNew, nodeDefsUpdated, record, tx) {
    // 1. insert missing nodes
    const { record: recordUpdateInsert, nodes: missingNodes = {} } = await _insertMissingSingleNodes(survey, nodeDefsNew, record, this.getUser(), tx)
    record = recordUpdateInsert || record

    // 2. apply default values and recalculate applicability
    const { record: recordUpdate, nodes: nodesUpdatedDefaultValues = {} } = await _applyDefaultValuesAndApplicability(survey, nodeDefsUpdated, record, missingNodes, tx)
    record = recordUpdate || record

    // 3. validate nodes
    const nodesToValidate = {
      ...missingNodes,
      ...nodesUpdatedDefaultValues
    }
    const nodeDefsToValidate = R.concat(nodeDefsNew, nodeDefsUpdated)

    await _validateNodes(survey, nodeDefsToValidate, record, nodesToValidate, tx)
  }
}

const _applyDefaultValuesAndApplicability = async (survey, nodeDefsUpdated, record, newNodes, tx) => {
  const nodesToUpdate = {
    ...newNodes
  }

  // include nodes associated to updated node defs
  for (const nodeDefUpdated of nodeDefsUpdated) {
    const nodesToUpdatePartial = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDefUpdated))(record)
    for (const nodeUpdated of nodesToUpdatePartial) {
      nodesToUpdate[Node.getUuid(nodeUpdated)] = nodeUpdated
    }
  }

  return await RecordManager.updateNodesDependents(survey, record, nodesToUpdate, tx)
}

const _validateNodes = async (survey, nodeDefs, record, nodes, tx) => {
  const nodesToValidate = {
    ...nodes
  }

  // include parent nodes of new/updated node defs (needed for min/max count validation)
  for (const def of nodeDefs) {
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)
    for (const parentNode of parentNodes) {
      nodesToValidate[Node.getUuid(parentNode)] = parentNode
    }
  }

  await RecordManager.validateNodesAndPersistValidation(survey, record, nodesToValidate, tx)
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
      return await RecordManager.insertNode(survey, record, childNode, user, tx)
    }
  }
  return {}
}

/**
 * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const _insertMissingSingleNodes = async (survey, nodeDefsNew, record, user, tx) => {
  let allInsertedNodes = {}
  for (const nodeDef of nodeDefsNew) {
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(record)
    for (const parentNode of parentNodes) {
      const insertedNodes = await _insertMissingSingleNode(survey, nodeDef, record, parentNode, user, tx)
      Object.assign(allInsertedNodes, insertedNodes)
    }
  }
  return allInsertedNodes
}

RecordCheckJob.type = 'RecordCheckJob'

module.exports = RecordCheckJob
