import * as ProcessUtils from '@core/processUtils'
import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ProcessingStepScriptGenerator from './_processingChainScriptGenerator/processingStepScriptGenerator'

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
  // ======  UPDATE - Chain
  updateChain,
  // ======  DELETE - Chain
  deleteChain,
  // ======  DELETE - Step
  deleteStep,
  // ======  DELETE - Calculation
  deleteCalculation,
} from '../manager/processingChainManager'

// ====== EXECUTION

export const generateScript = async (surveyId, cycle, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    await ProcessingStepScriptGenerator.generateScript(survey, cycle, processingStep, outputDir)
  }
}
