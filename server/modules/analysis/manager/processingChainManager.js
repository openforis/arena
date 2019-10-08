const ProcessingChainRepository = require('../repository/processingChainRepository')

module.exports = {
  // READ
  countChainsBySurveyId: ProcessingChainRepository.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainRepository.fetchChainsBySurveyId,
}