import * as Survey from '@core/survey/survey'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as ProcessingStepCalculationRepository from '../repository/processingStepCalculationRepository'
import * as RChainRepository from '../repository/rChainRepository'

// ==== READ
export const fetchStepData = async (survey, cycle, stepUuid) => {
  const surveyId = Survey.getId(survey)
  const [step, calculations] = await Promise.all([
    ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid),
    ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid),
  ])

  const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
  const nodeDefCalculations = calculations.map((calculation) =>
    Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
  )

  return RChainRepository.fetchStepData(surveyId, cycle, entityDef, entityDefParent, nodeDefCalculations)
}

// ==== UPDATE
export { default as MassiveInsertNodeResults } from './massiveInsertNodeResults'

// ==== DELETE
export const { deleteNodeResults } = RChainRepository
