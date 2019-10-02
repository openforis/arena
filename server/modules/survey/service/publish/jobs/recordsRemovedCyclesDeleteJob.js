const R = require('ramda')

const Job = require('../../../../../job/job')

const Survey = require('../../../../../../common/survey/survey')

const RecordManager = require('../../../../record/manager/recordManager')
const SurveyManager = require('../../../../survey/manager/surveyManager')

class RecordsRemovedCyclesDeleteJob extends Job {

  constructor (params) {
    super(RecordsRemovedCyclesDeleteJob.type, params)
  }

  async execute (tx) {
    this.total = 2

    // 1. find deleted cycles
    const cycleKeysDeleted = await this._findDeletedCycleKeys()
    this.logDebug(`deleted cycles: ${cycleKeysDeleted}`)
    this.incrementProcessedItems()

    // 2. delete records of deleted cycles
    if (!R.isEmpty(cycleKeysDeleted)) {
      this.logDebug(`deleting records`)
      const recordsDeletedUuids = await RecordManager.deleteRecordsByCycles(this.surveyId, cycleKeysDeleted, this.tx)
      this.logDebug(`deleted ${R.length(recordsDeletedUuids)} records`)
    }
    this.incrementProcessedItems()
  }

  async _findDeletedCycleKeys () {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (Survey.isPublished(surveyInfo)) {
      const surveyPrev = await SurveyManager.fetchSurveyById(this.surveyId, false, false, this.tx)
      const surveyInfoPrev = Survey.getSurveyInfo(surveyPrev)
      return R.difference(Survey.getCycleKeys(surveyInfoPrev), Survey.getCycleKeys(surveyInfo))
    } else {
      return []
    }
  }

}

RecordsRemovedCyclesDeleteJob.type = 'RecordsRemovedCyclesDeleteJob'

module.exports = RecordsRemovedCyclesDeleteJob