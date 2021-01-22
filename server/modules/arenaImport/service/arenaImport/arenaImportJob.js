import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

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

    const { arenaSurveyFileZip, surveyId } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (!this.isSucceeded() && surveyId) {
      await SurveyManager.dropSurveySchema(surveyId)
    }
  }
}

ArenaImportJob.type = 'ArenaImportJob'
