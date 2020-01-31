import RChain from '@server/modules/analysis/service/_rChain/rChain'

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
  // ======  UPDATE - Chain
  updateChain,
  // ======  DELETE - Chain
  deleteChain,
  // ======  DELETE - Step
  deleteStep,
  // ======  DELETE - Calculation
  deleteCalculation,
} from '../manager/processingChainManager'

export const generateScript = async (surveyId, cycle, chainUuid) => {
  await new RChain(surveyId, cycle, chainUuid).init()
}
