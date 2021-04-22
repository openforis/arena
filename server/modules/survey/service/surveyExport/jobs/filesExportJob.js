import * as PromiseUtils from '@core/promiseUtils'

import * as RecordFile from '@core/record/recordFile'
import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import { ExportFile } from '../exportFile'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    // TODO fetch files using strem
    const filesData = await FileService.fetchFilesBySurveyId(surveyId)

    this.total = filesData.length

    await PromiseUtils.each(filesData, async (fileData) => {
      const fileUuid = RecordFile.getUuid(fileData)
      const content = RecordFile.getContent(fileData)
      const contentBuffer = Buffer.from(Object.values(content))

      archive.append(contentBuffer, { name: ExportFile.file({ fileUuid }) })
      this.incrementProcessedItems()
    })
  }
}
