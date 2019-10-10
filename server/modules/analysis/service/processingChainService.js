const ProcessingChainManager = require('../manager/processingChainManager')

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
}