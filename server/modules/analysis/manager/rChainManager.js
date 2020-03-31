import * as Survey from '@core/survey/survey'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as ProcessingStepCalculationRepository from '../repository/processingStepCalculationRepository'
import * as RChainRepository from '../repository/rChainRepository'

export const fetchStepData = async (survey, cycle, stepUuid) => {
  const surveyId = Survey.getId(survey)
  let step = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid)
  const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid)
  step = ProcessingStep.assocCalculations(calculations)(step)
  return await RChainRepository.fetchStepData(survey, cycle, step)
}
