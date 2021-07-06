import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import SurveyExportJob from '../surveyExport/surveyExportJob'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    const backup = false
    // pass backup parameter to inner jobs
    super(SurveyCloneJob.type, { ...params, backup }, [new SurveyExportJob({ backup }), new ArenaImportJob({ backup })])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({ surveyId })
  }

  async onEnd() {
    await super.onEnd()

    const { surveyId } = this.context

    if (surveyId) {
      if (this.isSucceeded()) {
        this.logDebug(`removing 'temporary' flag from survey ${surveyId}...`)
        await SurveyManager.removeSurveyTemporaryFlag({ surveyId })
        this.logDebug(`'temporary' flag removed from survey ${surveyId}`)
      } else {
        this.logDebug(`deleting temporary survey ${surveyId}...`)
        await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
        this.logDebug(`survey ${surveyId} deleted!`)
      }
    }
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
