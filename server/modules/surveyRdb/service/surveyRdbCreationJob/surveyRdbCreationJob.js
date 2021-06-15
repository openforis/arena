import Job from '@server/job/job'

import SurveyRdbSchemaCreationJob from './surveyRdbSchemaCreationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './surveyRdbDataTablesAndViewsCreationJob'
import RecordsUniquenessValidationJob from './recordsUniquenessValidationJob'

export default class SurveyRdbCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}

SurveyRdbCreationJob.type = 'SurveyRdbCreationJob'
