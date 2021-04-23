import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'

import SurveyExportJob from '../surveyExport/surveyExportJob'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'

export default class SurveyCloneJob extends Job {
  constructor(params) {
    const { surveyIdSource } = params
    super(SurveyCloneJob.type, params, [
      new SurveyExportJob({ surveyId: surveyIdSource, cloning: true }),
      new ArenaImportJob({ cloning: true }),
    ])
  }

  async beforeInnerJobStart(innerJob) {
    super.beforeInnerJobStart(innerJob)

    if (innerJob instanceof ArenaImportJob) {
      const { survey } = this.context
      this.setContext({ surveyInfoTarget: Survey.getSurveyInfo(survey) })
    }
  }

  async beforeSuccess() {
    const { surveyIdTarget: surveyId } = this.context

    this.setResult({ surveyId })
  }
}

SurveyCloneJob.type = 'SurveyCloneJob'
