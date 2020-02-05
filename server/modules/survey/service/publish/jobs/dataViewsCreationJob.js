import Job from '@server/job/job'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as UserAnalysisManager from '@server/modules/analysis/manager/userAnalysisManager'

export default class DataViewsCreationJob extends Job {
  constructor() {
    super(DataViewsCreationJob.type)
  }

  async exectute() {}
}
DataViewsCreationJob.type = 'DataViewsCreationJob'
