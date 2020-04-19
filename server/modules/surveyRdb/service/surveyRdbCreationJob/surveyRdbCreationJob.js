import Job from '@server/job/job'

import SurveyRdbResultTablesCreationJob from './surveyRdbResultTablesCreationJob'
import SurveyRdbSchemaCreationJob from './surveyRdbSchemaCreationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './surveyRdbDataTablesAndViewsCreationJob'
import RecordsUniquenessValidationJob from './recordsUniquenessValidationJob'

export default class SurveyRdbCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbResultTablesCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}

SurveyRdbCreationJob.type = 'SurveyRdbCreationJob'
