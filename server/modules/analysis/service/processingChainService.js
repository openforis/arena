import RChain from '@server/modules/analysis/service/_rChain/rChain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

export {
  // ======  READ - Chain
  countChainsBySurveyId,
  fetchChainsBySurveyId,
  fetchChainByUuid,
  // ======  READ - Steps
  fetchStepsByChainUuid,
  fetchStepSummaryByIndex,
  // ======  READ - Calculations
  fetchCalculationsByStepUuid,
  fetchCalculationAttributeUuidsByStepUuid,
  fetchCalculationAttributeUuidsByChainUuid,
  fetchCalculationAttributeUuidsByChainUuidExcluded,
  // ======  UPDATE - Chain
  updateChain,
  // ======  DELETE - Chain
  deleteChain,
  // ======  DELETE - Step
  deleteStep,
  // ======  DELETE - Calculation
  deleteCalculation,
} from '../manager/processingChainManager'

export const fetchStepData = async (surveyId, cycle, stepUuid) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)
  return await ProcessingChainManager.fetchStepData(survey, cycle, stepUuid)
}

export const generateScript = async (surveyId, cycle, chainUuid, serverUrl) => {
  await new RChain(surveyId, cycle, chainUuid, serverUrl).init()
}
