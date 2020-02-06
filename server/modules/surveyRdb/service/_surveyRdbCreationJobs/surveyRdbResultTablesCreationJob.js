import * as R from 'ramda'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import Job from '@server/job/job'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

export default class SurveyRdbResultTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbResultTablesCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    await SurveyRdbManager.createResultNodeTable(surveyId, tx)

    const chains = await ProcessingChainManager.fetchChainsBySurveyId(surveyId, null, 0, null, tx)
    for (const chain of chains) {
      const chainUuid = ProcessingChain.getUuid(chain)
      const steps = await ProcessingChainManager.fetchStepsAndCalculationsByChainUuid(surveyId, chainUuid, tx)
      for (const step of steps) {
        // Generate materialized view for step that are linked to an entity
        if (ProcessingStep.hasEntity(step)) {
          const nodeDefUuids = R.pipe(
            ProcessingStep.getCalculations,
            R.map(ProcessingStepCalculation.getNodeDefUuid),
          )(step)
          const nodeDefs = await Promise.all(
            nodeDefUuids.map(nodeDefUuid => NodeDefManager.fetchNodeDefByUuid(surveyId, nodeDefUuid, false, false, tx)),
          )
          console.log(nodeDefs)
          const stepUuid = ProcessingStep.getUuid(step)

          await SurveyRdbManager.createResultStepView(surveyId, chainUuid, stepUuid, nodeDefs, tx)
        }
      }
    }
  }
}

SurveyRdbResultTablesCreationJob.type = 'SurveyRdbResultTablesCreationJob'
