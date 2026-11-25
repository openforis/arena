import { Objects } from '@openforis/arena-core'

import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'
import Job, { type JobParams } from '@server/job/job'
import * as AnalysisManager from '@server/modules/analysis/manager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class ChainsSamplingNodeDefsCheckJob extends Job {
  static readonly type: string = 'ChainsSamplingNodeDefsCheckJob'

  constructor(params?: Partial<JobParams>) {
    super(ChainsSamplingNodeDefsCheckJob.type, params)
  }

  async execute() {
    const { surveyId, tx, user } = this

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, draft: true, advanced: true, includeAnalysis: true },
      tx
    )
    const chains = await AnalysisManager.fetchChains({ surveyId }, tx)
    for (const chain of chains) {
      const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determinePlotAreaNodeDefs({ survey, chain })
      for (const nodeDefToDelete of nodeDefsToDelete) {
        await NodeDefManager.markNodeDefDeleted({ user, survey, nodeDefUuid: nodeDefToDelete.uuid }, tx) // NOSONAR
      }
      if (!Objects.isEmpty(nodeDefsToCreate)) {
        await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: nodeDefsToCreate }, tx) // NOSONAR
      }
    }
  }
}
