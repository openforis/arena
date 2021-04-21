import Job from '@server/job/job'
import * as RecordService from '@server/modules/record/service/recordService'
import * as FileUtils from '@server/utils/file/fileUtils'

const recordsPathDir = 'records'

export default class RecordsBackupJob extends Job {
  constructor(params) {
    super('RecordsBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const recordsPathFile = FileUtils.join(recordsPathDir, 'records.json')
    const records = await RecordService.fetchRecordsUuidAndCycle(surveyId)
    archive.append(JSON.stringify(records, null, 2), { name: recordsPathFile })

    await Promise.all(
      records.map(async (record) => {
        const recordData = await RecordService.fetchRecordAndNodesByUuid(surveyId, record.uuid, true)

        archive.append(JSON.stringify(recordData, null, 2), {
          name: FileUtils.join(recordsPathDir, `${record.uuid}.json`),
        })
      })
    )
  }
}
