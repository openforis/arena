import Job from '@server/job/job'

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
}

SurveyCloneJob.type = 'SurveyCloneJob'
