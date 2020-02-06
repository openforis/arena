import Job from '@server/job/job'

import SurveyRdbResultTablesCreationJob from './_surveyRdbCreationJobs/surveyRdbResultTablesCreationJob'
import SurveyRdbSchemaCreationJob from './_surveyRdbCreationJobs/surveyRdbSchemaCreationJob'
import SurveyRdbDataTablesAndViewsCreationJob from './_surveyRdbCreationJobs/surveyRdbDataTablesAndViewsCreationJob'
import AnalysisUserCreationJob from './_surveyRdbCreationJobs/analysisUserCreationJob'
import RecordsUniquenessValidationJob from './_surveyRdbCreationJobs/recordsUniquenessValidationJob'

export default class SurveyRdbCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbCreationJob.type, params, [
      new SurveyRdbSchemaCreationJob(),
      new SurveyRdbResultTablesCreationJob(),
      new SurveyRdbDataTablesAndViewsCreationJob(),
      new AnalysisUserCreationJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}

SurveyRdbCreationJob.type = 'SurveyRdbCreationJob'
