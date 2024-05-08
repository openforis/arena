import Job from '@server/job/job'
import * as RecordService from '@server/modules/record/service/recordService'
import { ExportFile } from '../exportFile'

export default class RecordsExportJob extends Job {
  constructor(params) {
    super('RecordsExportJob', params)
  }

  async execute() {
    const { archive, surveyId, recordUuids } = this.context

    const records = await RecordService.fetchRecordsUuidAndCycle({ surveyId, recordUuidsIncluded: recordUuids })
    archive.append(JSON.stringify(records, null, 2), { name: ExportFile.records })

    this.total = records.length

    for await (const record of records) {
      const recordUuid = record.uuid
      const recordData = await RecordService.fetchRecordAndNodesByUuid({ surveyId, recordUuid, fetchForUpdate: false })
      archive.append(JSON.stringify(recordData, null, 2), {
        name: ExportFile.record({ recordUuid }),
      })
      this.incrementProcessedItems()
    }
  }
}
