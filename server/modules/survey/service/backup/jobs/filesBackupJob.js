import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class FilesBackupJob extends Job {
  constructor(params) {
    super('FilesBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    const filesData = await FileService.fetchFilesBySurveyId(surveyId)

    const filesPathDir = 'files'
    await Promise.all(
      filesData.map(async (fileData) => {
        archive.append(JSON.stringify(fileData, null, 2), {
          name: FileUtils.join(filesPathDir, `${fileData.uuid}.json`),
        })
      })
    )
  }
}
