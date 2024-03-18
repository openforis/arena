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
        const innerJob = new SurveyRdbCreationJob({ surveyId })
        await innerJob.start()
        this.incrementProcessedItems()
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
