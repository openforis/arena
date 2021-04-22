import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'

import * as FileManager from '@server/modules/record/manager/fileManager'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

export default class FilesImportJob extends Job {
  constructor(params) {
    super('FilesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId } = this.context

    const fileUuids = await ArenaSurveyFileZip.getFileUuids(arenaSurveyFileZip)

    await PromiseUtils.each(fileUuids, async (fileUuid) => {
      const file = await ArenaSurveyFileZip.getFile(arenaSurveyFileZip, fileUuid)
      FileManager.insertFile(surveyId, file, this.tx)
    })
  }
}
