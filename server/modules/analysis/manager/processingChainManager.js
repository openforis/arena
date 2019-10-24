const db = require('@server/db/db')

const ActivityLog = require('../../activityLog/activityLogger')

const ProcessingChain = require('@common/analysis/processingChain')

const ProcessingChainRepository = require('../repository/processingChainRepository')

const createChain = async (user, surveyId, cycle, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLog.log(user, surveyId, ActivityLog.type.processingChainCreate,
      { processingChain }, false, t)
    return ProcessingChain.getUuid(processingChain)
  })

const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.processingChainPropUpdate,
      { uuid: processingChainUuid, key, value }, false, t)
  ]))

const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.processingChainDelete, { uuid: processingChainUuid }, false, t)
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

  // DELETE
  deleteChain,
}