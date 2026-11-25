import Job, { type JobParams } from '@server/job/job'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'

import RecordsImportJob from './dataImportJobs/recordsImportJob'
import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'

export default class CollectDataImportJob extends Job {
  static readonly type = 'CollectDataImportJob'

  constructor(params?: Partial<JobParams>) {
    super(CollectDataImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new RecordsImportJob(),
      new RecordCheckJob(),
      new SurveyRdbCreationJob(),
    ])
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    const { insertedRecords } = this.context

    this.setResult({ insertedRecords })
  }
}
