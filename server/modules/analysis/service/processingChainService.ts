import ProcessUtils from '../../../../core/processUtils';
import ProcessingChain from '../../../../common/analysis/processingChain';
import ProcessingChainManager from '../manager/processingChainManager';
import SurveyManager from '../../survey/manager/surveyManager';
import ProcessingStepScriptGenerator from './_processingChainScriptGenerator/processingStepScriptGenerator';

const generateScript = async (surveyId, processingChain) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, ProcessingChain.getCycle(processingChain))

  const outputDir = ProcessUtils.ENV.analysisOutputDir
  for (const processingStep of ProcessingChain.getProcessingSteps(processingChain)) {
    await ProcessingStepScriptGenerator.generateScript(survey, ProcessingChain.getCycle(processingChain), processingStep, outputDir)
  }

}

export default {
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
};
