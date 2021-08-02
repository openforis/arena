import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import { ExportFile } from '../exportFile'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const fileUuids = await FileService.fetchFileUuidsBySurveyId(surveyId, this.tx)
    this.total = fileUuids.length
    this.logDebug(`file(s) to export: ${this.total}`)

    await PromiseUtils.each(fileUuids, async (fileUuid) => {
      const fileData = await FileService.fetchFileByUuid(surveyId, fileUuid, this.tx)
      archive.append(JSON.stringify(fileData, null, 2), { name: ExportFile.file({ fileUuid }) })
      this.incrementProcessedItems()
    })
  }
}
