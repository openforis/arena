import * as Survey from '@core/survey/survey'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as RChainRepository from '../repository/rChainRepository'

// ==== READ
export const fetchStepData = async (survey, cycle, stepUuid) => {
  const surveyId = Survey.getId(survey)
  const step = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid)
  const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)

  return RChainRepository.fetchStepData(survey, cycle, entityDef, entityDefParent)
}

// ==== UPDATE
export { default as MassiveInsertNodeResults } from './massiveInsertNodeResults'

// ==== DELETE
export const { deleteNodeResults } = RChainRepository
