const R = require('ramda')

const Job = require('../../../../../job/job')

const RecordManager = require('../../../../record/manager/recordManager')
const SurveyPublishJobUtils = require('../surveyPublishJobUtils')

class RecordsRemovedCyclesDeleteJob extends Job {

  constructor (params) {
    super(RecordsRemovedCyclesDeleteJob.type, params)
  }

  async execute (tx) {
    this.total = 2

    // 1. find deleted cycles
    const cycleKeysDeleted = await SurveyPublishJobUtils.findDeletedCycleKeys(this.surveyId, this.tx)
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

}

RecordsRemovedCyclesDeleteJob.type = 'RecordsRemovedCyclesDeleteJob'

module.exports = RecordsRemovedCyclesDeleteJob