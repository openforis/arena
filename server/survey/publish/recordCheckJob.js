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

      for (const recordUuid of recordUuids) {
        const record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, tx)
        await this.checkRecord(survey, nodeDefsNew, nodeDefsUpdated, record, tx)
      }
    }
  }

  async checkRecord (survey, nodeDefsNew, nodeDefsUpdated, record, tx) {
    // 1. insert missing nodes
    const missingNodesUpdated = await RecordMissingNodesCreator.insertMissingSingleNodes(survey, nodeDefsNew, record, this.user, tx)
    record = Record.assocNodes(missingNodesUpdated)(record)

    // 2. apply default values
    const defaultValuesUpdated = await applyDefaultValues(survey, nodeDefsUpdated, record, missingNodesUpdated, tx)
    record = Record.assocNodes(defaultValuesUpdated)(record)

    // 3. validate nodes
    const nodesToValidate = R.mergeRight(missingNodesUpdated, defaultValuesUpdated)
    await RecordValidationManager.validateNodes(survey, record, nodesToValidate, false, tx)
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

RecordCheckJob.type = 'RecordCheckJob'

module.exports = RecordCheckJob
