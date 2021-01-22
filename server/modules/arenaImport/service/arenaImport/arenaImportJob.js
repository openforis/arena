import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import AarenaSurveyReaderJob from './metaImportJobs/arenaSurveyReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'

export default class ArenaImportJob extends Job {
  constructor(params) {
    super(ArenaImportJob.type, params, [new AarenaSurveyReaderJob(), new SurveyCreatorJob()])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, surveyId, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (!this.isSucceeded() && surveyId) {
      await FileUtils.rmdir(filePath)
      await SurveyManager.dropSurveySchema(surveyId)
    }
  }
}

ArenaImportJob.type = 'ArenaImportJob'
