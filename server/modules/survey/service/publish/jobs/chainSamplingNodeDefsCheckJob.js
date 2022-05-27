import { Objects, Promises } from '@openforis/arena-core'
import { SamplingNodeDefs } from '@common/analysis/samplingNodeDefs'

import Job from '@server/job/job'

import * as AnalysisManager from '@server/modules/analysis/manager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

export default class ChainSamplingNodeDefsCheckJob extends Job {
  constructor(params) {
    super(ChainSamplingNodeDefsCheckJob.type, params)
  }

  async execute() {
    const { surveyId, tx, user } = this

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, draft: true, advanced: true, includeAnalysis: true },
      tx
    )
    const chains = await AnalysisManager.fetchChains({ surveyId }, tx)
    await Promises.each(chains, async (chain) => {
      const { nodeDefsToCreate, nodeDefsToDelete } = SamplingNodeDefs.determineSamplingNodeDefs({ survey, chain })
      if (!Objects.isEmpty(nodeDefsToDelete)) {
        await Promises.each(nodeDefsToDelete, async (nodeDefToDelete) => {
          await NodeDefManager.markNodeDefDeleted({ user, survey, nodeDefUuid: nodeDefToDelete.uuid }, tx)
        })
      }
      if (!Objects.isEmpty(nodeDefsToCreate)) {
        await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: nodeDefsToCreate }, tx)
      }
    })
  }
}

ChainSamplingNodeDefsCheckJob.type = 'ChainSamplingNodeDefsCheckJob'
