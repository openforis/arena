import Job from '@server/job/job'

import SurveyRdbCreationJob from './surveyRdbCreationJob'

export default class SurveysRdbRefreshJob extends Job {
  constructor(params) {
    super(SurveysRdbRefreshJob.type, params)
  }

  async execute() {
    const { surveyIds } = this.context
    this.total = surveyIds.length
    for await (const surveyId of surveyIds) {
      try {
        this.logDebug(`refreshing RDB for survey ${surveyId}`)
        const innerJob = new SurveyRdbCreationJob({ surveyId })
        await innerJob.start()
        if (innerJob.isSucceeded()) {
          this.logDebug(`RDB for survey ${surveyId} refreshed successfully`)
          this.incrementProcessedItems()
        } else if (innerJob.isFailed()) {
          this.logDebug(`something went wrong updating RDB for survey ${surveyId}`)
        }
      } catch (error) {
        // ignore it
      }
    }
    const message =
      this.processed === this.total
        ? `All RDBs (${this.total}) refreshed successfully`
        : `Only ${this.processed}/${this.total} RDBs refreshed successully`
    this.logDebug(message)
  }
}

SurveysRdbRefreshJob.type = 'SurveysRdbRefreshJob'
