import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class FilesExportJob extends Job {
  constructor(params) {
    super('FilesExportJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const filesPathDir = 'files'

    const filesData = await FileService.fetchFilesBySurveyId(surveyId)

    this.total = filesData.length

    await PromiseUtils.each(filesData, async (fileData) => {
      archive.append(JSON.stringify(fileData, null, 2), {
        name: FileUtils.join(filesPathDir, `${fileData.uuid}.json`),
      })
      this.incrementProcessedItems()
    })
  }
}
