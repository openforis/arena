const ProcessUtils = require('@core/processUtils')
const ProcessingChain = require('@common/analysis/processingChain')

const ProcessingChainManager = require('../manager/processingChainManager')
const SurveyManager = require('../../survey/manager/surveyManager')

const ProcessingStepScriptGenerator = require('./_processingChainScriptGenerator/processingStepScriptGenerator')

const generateScript = async (surveyId, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, ProcessingChain.getCycle(processingChain))

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    await ProcessingStepScriptGenerator.generateScript(survey, ProcessingChain.getCycle(processingChain), processingStep, outputDir)
  }

}

module.exports = {
  // CREATE
  createChain: ProcessingChainManager.createChain,

  // READ
  countChainsBySurveyId: ProcessingChainManager.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainManager.fetchChainsBySurveyId,
  fetchChainByUuid: ProcessingChainManager.fetchChainByUuid,

  // UPDATE
  updateChainProp: ProcessingChainManager.updateChainProp,

  // DELETE
  deleteChain: ProcessingChainManager.deleteChain,

  generateScript,
}