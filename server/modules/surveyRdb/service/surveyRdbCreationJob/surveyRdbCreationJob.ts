import Job, { type JobParams } from '@server/job/job'

import RecordsUniquenessValidationJob from './recordsUniquenessValidationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './surveyRdbDataTablesAndViewsCreationJob'
import SurveyRdbOlapDataTablesCreationJob from './surveyRdbOlapDataTablesCreationJob'
import SurveyRdbSchemaCreationJob from './surveyRdbSchemaCreationJob'

export default class SurveyRdbCreationJob extends Job {
  static readonly type = 'SurveyRdbCreationJob'

  constructor(params?: Partial<JobParams>) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
      new SurveyRdbOlapDataTablesCreationJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}
