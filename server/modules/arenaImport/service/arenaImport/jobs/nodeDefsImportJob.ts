import * as Survey from '@core/survey/survey'
import Job, { type JobParams } from '@server/job/job'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

export default class NodeDefsImportJob extends Job {
  static readonly type = 'NodeDefsImportJob'

  constructor(params?: Partial<JobParams>) {
    super(NodeDefsImportJob.type, params)
  }

  async execute() {
    const { arenaSurvey, backup, surveyId, survey } = this.context

    const nodeDefs = Survey.getNodeDefsArray(arenaSurvey)
    if (nodeDefs.length === 0) return

    await NodeDefManager.insertNodeDefsBatch(
      {
        surveyId,
        nodeDefs,
        backup,
      },
      this.tx
    )

    const surveyUpdated = Survey.assocNodeDefsSimple({ nodeDefs: Survey.getNodeDefs(arenaSurvey) })(survey)
    this.setContext({ survey: surveyUpdated })
  }
}
