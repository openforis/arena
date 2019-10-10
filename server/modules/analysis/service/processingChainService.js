const ProcessingChainManager = require('../manager/processingChainManager')

module.exports = {
  // READ
  countChainsBySurveyId: ProcessingChainManager.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainManager.fetchChainsBySurveyId,
  fetchChainByUuid: ProcessingChainManager.fetchChainByUuid,
  // UPDATE
  updateChainProp: ProcessingChainManager.updateChainProp,
}