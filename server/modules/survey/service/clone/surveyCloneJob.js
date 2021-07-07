import Job from '@server/job/job'

import SurveyExportJob from '../surveyExport/surveyExportJob'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'
import { SurveyCreatorJobHelper } from '../surveyCreatorJobHelper'

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
      await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
    }
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
