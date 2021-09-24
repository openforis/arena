import Job from '@server/job/job'

import SurveyRdbCreationJob from './surveyRdbCreationJob'

export default class SurveysRdbRefreshJob extends Job {
  constructor(params) {
    const { surveyIds } = params
    super(
      SurveysRdbRefreshJob.type,
      { surveyIds },
      surveyIds.map((surveyId) => new SurveyRdbCreationJob({ surveyId }))
    )
  }
}

SurveysRdbRefreshJob.type = 'SurveysRdbRefreshJob'
