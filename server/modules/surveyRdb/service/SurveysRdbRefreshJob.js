import Job from '@server/job/job'

import SurveyRdbCreationJob from './surveyRdbCreationJob'

export default class SurveysRdbRefreshJob extends Job {
  constructor(params) {
    super(SurveysRdbRefreshJob.type, params)
  }

  async execute() {
    const { surveyIds } = this.context
    this.total = surveyIds.length
    const surveysIdsWithErrors = []
    for await (const surveyId of surveyIds) {
      if (this.isCanceled()) {
        return
      }
      try {
        this.logDebug(`refreshing RDB for survey ${surveyId}`)
        const innerJob = new SurveyRdbCreationJob({ surveyId })
        await innerJob.start()

        if (innerJob.isSucceeded()) {
          this.logDebug(`RDB for survey ${surveyId} refreshed successfully`)
          this.incrementProcessedItems()
        } else if (innerJob.isFailed()) {
          surveysIdsWithErrors.push(surveyId)
          this.logDebug(`something went wrong updating RDB for survey ${surveyId}`)
        }
      } catch (error) {
        surveysIdsWithErrors.push(surveyId)
        this.logDebug(`something went wrong updating RDB for survey ${surveyId}`)
      }
    }
    const message =
      this.processed === this.total
        ? `All RDBs (${this.total}) refreshed successfully`
        : `Only ${this.processed}/${this.total} RDBs refreshed successully. Surveys with errors: ${surveysIdsWithErrors}`
    this.logDebug(message)
  }
}

SurveysRdbRefreshJob.type = 'SurveysRdbRefreshJob'
