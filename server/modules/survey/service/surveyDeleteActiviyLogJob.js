import Job from '@server/job/job'
import * as SurveyManager from '../manager/surveyManager'

export default class SurveyDeleteActiviyLogJob extends Job {
  constructor(params) {
    super(SurveyDeleteActiviyLogJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { surveyId } = context
    await SurveyManager.deleteAllActivityLog({ surveyId }, tx)
  }
}

SurveyDeleteActiviyLogJob.type = 'SurveyDeleteActiviyLogJob'
