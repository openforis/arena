import Job, { type JobParams } from '@server/job/job'
import ArenaImportJob from '../../../arenaImport/service/arenaImport/arenaImportJob'
import { SurveyCreatorJobHelper } from '../surveyCreatorJobHelper'
import SurveyExportJob from '../surveyExport/surveyExportJob'

export default class SurveyCloneJob extends Job {
  static readonly type: string = 'SurveyCloneJob'

  constructor(params?: Partial<JobParams>) {
    const backup = false
    const cloning = true
    const { cycle } = params
    // pass backup parameter to inner jobs
    super(SurveyCloneJob.type, { ...params, backup }, [
      new SurveyExportJob({ backup, cycle, includeActivityLog: false }),
      new ArenaImportJob({ backup, cloning }),
    ])
  }

  beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({ surveyId })
    return Promise.resolve()
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
