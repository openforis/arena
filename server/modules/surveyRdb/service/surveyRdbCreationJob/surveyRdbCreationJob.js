import Job from '@server/job/job'

import SurveyRdbSchemaCreationJob from './surveyRdbSchemaCreationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './surveyRdbDataTablesAndViewsCreationJob'
import SurveyRdbOlapDataTablesCreationJob from './surveyRdbOlapDataTablesCreationJob'
import RecordsUniquenessValidationJob from './recordsUniquenessValidationJob'

export default class SurveyRdbCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
      new SurveyRdbOlapDataTablesCreationJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}

SurveyRdbCreationJob.type = 'SurveyRdbCreationJob'
