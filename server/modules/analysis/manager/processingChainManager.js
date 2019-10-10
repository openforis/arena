const db = require('../../../db/db')

const ActivityLog = require('../../activityLog/activityLogger')

const ProcessingChain = require('../../../../common/analysis/processingChain')

const ProcessingChainRepository = require('../repository/processingChainRepository')

const createChain = async (user, surveyId, cycle, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLog.log(user, surveyId, ActivityLog.type.processingChainCreate, { processingChain }, t)
    return ProcessingChain.getUuid(processingChain)
  })

const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.processingChainPropUpdate, { processingChainUuid, key, value }, t)
  ]))

module.exports = {
  // CREATE
  createChain,

  // READ
  countChainsBySurveyId: ProcessingChainRepository.countChainsBySurveyId,
  fetchChainsBySurveyId: ProcessingChainRepository.fetchChainsBySurveyId,
  fetchChainByUuid: ProcessingChainRepository.fetchChainByUuid,
  // UPDATE
  updateChainProp,
}