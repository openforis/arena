import Job from '@server/job/job'

import SurveyExportJob from '../surveyExport/surveyExportJob'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    const { surveyIdSource } = params
    super(SurveyCloneJob.type, params, [
      new SurveyExportJob({ surveyId: surveyIdSource, backup: false }),
      new ArenaImportJob({ backup: false }),
    ])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({ surveyId })
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
