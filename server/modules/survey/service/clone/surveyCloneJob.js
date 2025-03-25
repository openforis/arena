import Job from '@server/job/job'

import SurveyExportJob from '../surveyExport/surveyExportJob'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'
import { SurveyCreatorJobHelper } from '../surveyCreatorJobHelper'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    const backup = false
    const cloning = true
    const { cycle } = params
    // pass backup parameter to inner jobs
    super(SurveyCloneJob.type, { ...params, backup }, [
      new SurveyExportJob({ backup, cycle, includeActivityLog: false }),
      new ArenaImportJob({ backup, cloning }),
    ])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({ surveyId })
  }

  async onEnd() {
    await super.onEnd()

    const { surveyId: sourceSurveyId } = this.params
    const { surveyId: targetSurveyId } = this.context

    if (targetSurveyId && sourceSurveyId !== targetSurveyId) {
      await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId: targetSurveyId })
    }
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
