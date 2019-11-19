import * as ProcessUtils from '@core/processUtils'
import * as ProcessingChain from '@common/analysis/processingChain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as ProcessingStepScriptGenerator from './_processingChainScriptGenerator/processingStepScriptGenerator'

export {
  // ====== CREATE - Chain
  createChain,

  // ====== CREATE - Processing Step
  createProcessingStep,

  // ====== CREATE - Processing Step Calculation
  createProcessingStepCalculation,

  // ======  READ - Chain
  countChainsBySurveyId, fetchChainsBySurveyId, fetchChainByUuid,

  // ======  READ - Steps
  fetchStepsByChainUuid, fetchStepByUuid, fetchStepSummaryByIndex,

  // ======  UPDATE - Chain
  updateChainProp,

  // ======  UPDATE - Step
  updateStepProps, updateStepCalculationIndex,

  // ======  DELETE - Chain
  deleteChain,

  // ======  DELETE - Step
  deleteStep,
} from '../manager/processingChainManager'

// ====== EXECUTION

export const generateScript = async (surveyId, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, ProcessingChain.getCycle(processingChain))

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    await ProcessingStepScriptGenerator.generateScript(survey, ProcessingChain.getCycle(processingChain), processingStep, outputDir)
  }

}

