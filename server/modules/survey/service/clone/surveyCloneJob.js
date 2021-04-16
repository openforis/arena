import Job from '@server/job/job'

import CreateNewSurveyJob from './jobs/CreateNewSurveyJob'
import CloneTablesJob from './jobs/CloneTablesJob'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    super(SurveyCloneJob.type, params, [new CreateNewSurveyJob(), new CloneTablesJob()])
  }

  async beforeSuccess() {
    const { newSurveyId } = this.context

    this.setResult({
      surveyId: newSurveyId,
    })
  }

  async onEnd() {
    await super.onEnd()
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
