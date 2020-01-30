import * as FileUtils from '@server/utils/file/fileUtils'

import * as ProcessUtils from '@core/processUtils'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

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

// ====== EXECUTION

export const generateScriptDeprecated = async (surveyId, cycle, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle)

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    await ProcessingStepScriptGenerator.generateScript(survey, cycle, processingStep, outputDir)
  }
}

const _generateChainDirs = async path => {
  const dirSystem = FileUtils.join(path, 'system')
  const dirUser = FileUtils.join(path, 'user')
  await Promise.all([FileUtils.mkdir(dirSystem), FileUtils.mkdir(dirUser)])
  return { dirSystem, dirUser }
}

export const generateScript = async (surveyId, chainUuid) => {
  const dirChain = FileUtils.join(ProcessUtils.ENV.analysisOutputDir, chainUuid)
  await FileUtils.rmdir(dirChain)
  await FileUtils.mkdir(dirChain)
  const { dirSystem, dirUser } = await _generateChainDirs(dirChain)

  const fileArena = FileUtils.join(dirChain, 'arena.R')
  await FileUtils.appendFile(fileArena)

  const fileCommon = FileUtils.join(dirUser, 'common.R')
  await FileUtils.appendFile(fileCommon)

  const chain = await ProcessingChainManager.fetchChainByUuid(surveyId, chainUuid)
  const steps = await ProcessingChainManager.fetchStepsByChainUuid(surveyId, chainUuid)
  for (const step of steps) {
    const calculations = await ProcessingChainManager.fetchCalculationsByStepUuid(
      surveyId,
      ProcessingStep.getUuid(step),
    )
    console.log(JSON.stringify(calculations))
  }
}
