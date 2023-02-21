import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'

export default class RecordsCloneJob extends Job {
  constructor(params) {
    super(RecordsCloneJob.type, params)
  }

  async execute() {
    const { context } = this
    const { surveyId, cycleFrom, cycleTo } = context

    const recordsSummaryCycleFrom = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle: cycleFrom })
    const recordsSummaryCycleTo = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle: cycleTo })

    
  }
}

RecordsCloneJob.type = 'RecordsCloneJob'
