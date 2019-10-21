import db from '../../../db/db';
import ActivityLog from '../../activityLog/activityLogger';
import ProcessingChain from '../../../../common/analysis/processingChain';
import ProcessingChainRepository from '../repository/processingChainRepository';

const createChain = async (user, surveyId, cycle, client: any = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLog.log(user, surveyId, ActivityLog.type.processingChainCreate, { processingChain }, t)
    return ProcessingChain.getUuid(processingChain)
  })

const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client: any = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.processingChainPropUpdate, { processingChainUuid, key, value }, t)
  ]))

const deleteChain = async (user, surveyId, processingChainUuid, client: any = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.processingChainDelete, { processingChainUuid }, t)
  ]))

export default {
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
};
