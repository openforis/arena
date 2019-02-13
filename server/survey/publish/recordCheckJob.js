const R = require('ramda')

const { toUuidIndexedObj } = require('../../../common/survey/surveyUtils')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const Record = require('../../../common/record/record')

const SurveyManager = require('../../survey/surveyManager')
const RecordManager = require('../../record/recordManager')
const DependentNodesUpdater = require('../../record/update/thread/helpers/dependentNodesUpdater')
const RecordValidationManager = require('../../record/validator/recordValidationManager')

const RecordMissingNodesCreator = require('./helpers/recordMissingNodesCreator')

const Job = require('../../job/job')

class RecordCheckJob extends Job {

  constructor (params) {
    super(RecordCheckJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, true, true, false, tx)

    const nodeDefsNew = []
    const nodeDefsUpdated = []

    Survey.getNodeDefsArray(survey).forEach(def => {
      if (!NodeDef.isNodeDefPublished(def)) {
        nodeDefsNew.push(def)
      } else if (R.prop(NodeDef.keys.draftAdvanced, def)) {
        nodeDefsUpdated.push(def)
      }
    })

    if (!(R.isEmpty(nodeDefsNew) && R.isEmpty(nodeDefsUpdated))) {
      const recordUuids = await RecordManager.fetchRecordUuids(this.surveyId, tx)

      this.total = R.length(recordUuids)

      for (const recordUuid of recordUuids) {
        const record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, tx)
        await this.checkRecord(survey, nodeDefsNew, nodeDefsUpdated, record, tx)

        this.incrementProcessedItems()
      }
    }
  }

  async checkRecord (survey, nodeDefsNew, nodeDefsUpdated, record, tx) {
    // 1. insert missing nodes
    const missingNodes = await RecordMissingNodesCreator.insertMissingSingleNodes(survey, nodeDefsNew, record, this.user, tx)
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

  return await DependentNodesUpdater.updateNodes(survey, record, nodesToUpdate, tx)
}

const validateNodes = async (survey, nodeDefs, record, nodes, tx) => {
  // include parent nodes of new/updated node defs (needed for min/max count validation)
  const nodeDefsParentNodes = R.pipe(
    R.map(def => Record.getNodesByDefUuid(NodeDef.getNodeDefParentUuid(def))(record)),
    R.flatten,
    toUuidIndexedObj
  )(nodeDefs)

  const nodesToValidate = R.mergeRight(nodes, nodeDefsParentNodes)

  await RecordValidationManager.validateNodes(survey, record, nodesToValidate, false, tx)
}

RecordCheckJob.type = 'RecordCheckJob'

module.exports = RecordCheckJob
