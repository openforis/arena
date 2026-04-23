import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'

import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'

export default class DataDeleteJob extends Job {
  constructor(params) {
    super('DataDeleteJob', params)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 3

    // delete records
    await RecordRepository.deleteRecordsBySurvey(surveyId, tx)
    this.incrementProcessedItems()

    // drop RDB schema
    await SchemaRdbRepository.dropSchema(surveyId, tx)
    this.incrementProcessedItems()

    // delete record files
    const fileSummaries = await SurveyFileManager.fetchFileSummariesBySurveyId(surveyId, tx)
    const recordFileSummaries = fileSummaries.filter((fileSummary) => !!SurveyFile.getRecordUuid(fileSummary))

    if (recordFileSummaries.length > 0) {
      const filesToDeleteUuids = recordFileSummaries.map(SurveyFile.getUuid)
      await SurveyFileManager.deleteFilesAndContentByUuids({ surveyId, fileUuids: filesToDeleteUuids }, tx)
    }
    this.incrementProcessedItems()
  }
}
