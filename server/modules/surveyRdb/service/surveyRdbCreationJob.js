import Job from '@server/job/job'

import SurveyRdbResultTablesCreationJob from './_surveyRdbCreationJob/surveyRdbResultTablesCreationJob'
import SurveyRdbSchemaCreationJob from './_surveyRdbCreationJob/surveyRdbSchemaCreationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './_surveyRdbCreationJob/surveyRdbDataTablesAndViewsCreationJob'

export default class SurveyRdbCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbResultTablesCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
    ])
  }
}

SurveyRdbCreationJob.type = 'SurveyRdbCreationJob'
