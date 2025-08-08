import * as RecordFile from '@core/record/recordFile'

import Job from '@server/job/job'

import * as FileManager from '@server/modules/record/manager/fileManager'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'

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
    const fileSummaries = await FileManager.fetchFileSummariesBySurveyId(surveyId, tx)
    const recordFileSummaries = fileSummaries.filter((fileSummary) => !!RecordFile.getRecordUuid(fileSummary))

    if (recordFileSummaries.length > 0) {
      const filesToDeleteUuids = recordFileSummaries.map(RecordFile.getUuid)
      await FileManager.deleteFilesByUuids(surveyId, filesToDeleteUuids, tx)
      await FileManager.deleteSurveyFilesContentByUuids({ surveyId, fileUuids: filesToDeleteUuids })
    }
    this.incrementProcessedItems()
  }
}
