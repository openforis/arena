const db = require('../../../db/db')
const ActivityLog = require('../../activityLog/activityLogger')
const ProcessingChainRepository = require('../repository/processingChainRepository')

const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) => {
  client.tx(t => {
    Promise.all([
      ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
      ActivityLog.log(
        user,
        surveyId,
        ActivityLog.type.processingChainPropUpdate,
        { processingChainUuid, key, value },
        t
      )
    ])
  })
}

module.exports = {
  // READ
  countChainsBySurveyId: ProcessingChainRepository.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainRepository.fetchChainsBySurveyId,
  fetchChainByUuid: ProcessingChainRepository.fetchChainByUuid,
  // UPDATE
  updateChainProp,
}