const Record = require('../../../common/record/record')

const SurveyManager = require('../../survey/surveyManager')
const RecordManager = require('../../record/recordManager')
const DependentNodesUpdater = require('../../record/update/thread/helpers/dependentNodesUpdater')
const RecordValidationManager = require('../../record/validator/recordValidationManager')

const RecordMissingNodesCreator = require('./helpers/recordMissingNodesCreator')

const Job = require('../../job/job')

class RecordInitializeJob extends Job {

  constructor (params) {
    super(RecordInitializeJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, false, true, false, tx)
    const recordUuids = await RecordManager.fetchRecordUuids(this.surveyId, tx)
    for (const recordUuid of recordUuids) {
      const record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, recordUuid, tx)
      await this.initializeRecord(survey, record, tx)
    }
  }

  async initializeRecord (survey, record, tx) {
    // 1. insert missing nodes
    const recordWithAllNodes = await RecordMissingNodesCreator.insertMissingSingleNodes(survey, record, this.user, tx)

    // 2. apply default values
    const recordWithDefaultValuesApplied = await applyDefaultValues(survey, recordWithAllNodes, tx)

    // 3. validate nodes
    await RecordValidationManager.validateNodes(survey, recordWithDefaultValuesApplied,
      Record.getNodes(recordWithDefaultValuesApplied), false, tx)
  }
}

const applyDefaultValues = async (survey, record, tx) => {
  const updatedNodes = await DependentNodesUpdater.updateNodes(survey, record, Record.getNodes(record), tx)
  return Record.assocNodes(updatedNodes)(record)
}

RecordInitializeJob.type = 'RecordInitializeJob'

module.exports = RecordInitializeJob
