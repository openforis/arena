import Job from '@server/job/job'

import CreateNewSurveyJob from './jobs/CreateNewSurveyJob'
import CloneTablesJob from './jobs/CloneTablesJob'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    super(SurveyCloneJob.type, params, [
      new CreateNewSurveyJob(),
      new CloneTablesJob({
        tables: [
          'category',
          'category_level',
          'category_item',
          'taxonomy',
          'taxon',
          'taxon_vernacular_name',
          'node_def',
          'processing_chain',
          'processing_step',
          'processing_step_calculation',
        ],
      }),
    ])
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
