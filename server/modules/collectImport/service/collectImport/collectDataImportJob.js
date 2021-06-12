import Job from '@server/job/job'

import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'

import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'
import RecordsImportJob from './dataImportJobs/recordsImportJob'

export default class CollectDataImportJob extends Job {
  constructor(params) {
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

CollectDataImportJob.type = 'CollectDataImportJob'
