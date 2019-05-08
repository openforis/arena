const R = require('ramda')

const { toUuidIndexedObj } = require('../../../../common/survey/surveyUtils')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const SurveyManager = require('../manager/surveyManager')
const RecordManager = require('../../record/manager/recordManager')
const RecordUpdateManager = require('../../record/manager/recordUpdateManager')
const NodeDependentUpdateManager = require('../../record/manager/nodeDependentUpdateManager')
const RecordValidationManager = require('../../record/validator/recordValidationManager')

const Job = require('../../../job/job')

class RecordCheckJob extends Job {

  constructor (params) {
    super(RecordCheckJob.type, params)
  }

  async execute (tx) {
    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, true, true, false, tx)

    const nodeDefsNew = []
    const nodeDefsUpdated = []

    Survey.getNodeDefsArray(survey).forEach(def => {
      if (!NodeDef.isPublished(def)) {
        nodeDefsNew.push(def)
      } else if (R.prop(NodeDef.keys.draftAdvanced, def)) {
        nodeDefsUpdated.push(def)
      }
    })

    if (!(R.isEmpty(nodeDefsNew) && R.isEmpty(nodeDefsUpdated))) {
      const recordUuids = await RecordManager.fetchRecordUuids(surveyId, tx)

      this.total = R.length(recordUuids)

      for (const recordUuid of recordUuids) {
        const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, tx)
        await this.checkRecord(survey, nodeDefsNew, nodeDefsUpdated, record, tx)

        this.incrementProcessedItems()
      }
    }
  }

  async checkRecord (survey, nodeDefsNew, nodeDefsUpdated, record, tx) {
    // 1. insert missing nodes
    const missingNodes = await insertMissingSingleNodes(survey, nodeDefsNew, record, this.getUser(), tx)
    record = Record.assocNodes(missingNodes)(record)

    // 2. apply default values
    const defaultValuesUpdated = await applyDefaultValues(survey, nodeDefsUpdated, record, missingNodes, tx)
    record = Record.assocNodes(defaultValuesUpdated)(record)

    // 3. validate nodes
    await validateNodes(survey, R.concat(nodeDefsNew, nodeDefsUpdated), record, R.mergeRight(missingNodes, defaultValuesUpdated), tx)
  }
}

const applyDefaultValues = async (survey, nodeDefsUpdated, record, newNodes, tx) => {
  const updatedNodes = R.pipe(
    R.map(def => Record.getNodesByDefUuid(NodeDef.getUuid(def))(record)),
    R.flatten,
    toUuidIndexedObj
  )(nodeDefsUpdated)

  const nodesToUpdate = R.mergeRight(newNodes, updatedNodes)

  return await NodeDependentUpdateManager.updateNodes(survey, record, nodesToUpdate, tx)
}

const validateNodes = async (survey, nodeDefs, record, nodes, tx) => {
  // include parent nodes of new/updated node defs (needed for min/max count validation)
  const nodeDefsParentNodes = R.pipe(
    R.map(def => Record.getNodesByDefUuid(NodeDef.getParentUuid(def))(record)),
    R.flatten,
    toUuidIndexedObj
  )(nodeDefs)

  const nodesToValidate = R.mergeRight(nodes, nodeDefsParentNodes)

  await RecordValidationManager.validateNodes(survey, record, nodesToValidate, tx)
}

/**
 * Inserts a missing single node in a specified parent node.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const insertMissingSingleNode = async (survey, childDef, record, parentNode, user, tx) => {
  if (NodeDef.isSingle(childDef)) {
    const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
    if (R.isEmpty(children)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)
      return await RecordUpdateManager.insertNode(survey, record, childNode, user, tx)
    }
  }
  return {}
}

/**
 * Inserts all the missing single nodes in the specified records having the node def in the specified  ones.
 *
 * Returns an indexed object with all the inserted nodes.
 */
const insertMissingSingleNodes = async (survey, nodeDefsNew, record, user, tx) => {
  let allInsertedNodes = {}
  for (const nodeDef of nodeDefsNew) {
    const parentNodes = Record.getNodesByDefUuid(NodeDef.getParentUuid(nodeDef))(record)
    for (const parentNode of parentNodes) {
      const insertedNodes = await insertMissingSingleNode(survey, nodeDef, record, parentNode, user, tx)
      allInsertedNodes = R.mergeRight(allInsertedNodes, insertedNodes)
    }
  }
  return allInsertedNodes
}

RecordCheckJob.type = 'RecordCheckJob'

module.exports = RecordCheckJob
