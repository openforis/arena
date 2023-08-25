import Job from '@server/job/job'

import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'

export default class DataDeleteJob extends Job {
  constructor(params) {
    super('DataDeleteJob', params)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 2

    await RecordRepository.deleteRecordsBySurvey(surveyId, tx)
    this.incrementProcessedItems()

    await SchemaRdbRepository.dropSchema(surveyId, tx)
    this.incrementProcessedItems()
  }
}
