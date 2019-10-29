import db from '@server/db/db'

import * as ActivityLog from '@server/modules/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingChainRepository from '../repository/processingChainRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'

// ====== CREATE - Chain

export const createChain = async (user, surveyId, cycle, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, { processingChain }, false, t)
    return ProcessingChain.getUuid(processingChain)
  })

// ====== CREATE - Step

export const createStep = async (user, surveyId, processingChainUuid, processingStepIndex, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.insertStep(surveyId, processingChainUuid, processingStepIndex, t)
    await ActivityLogRepository.log(user, surveyId, ActivityLog.type.processingStepCreate, { processingStep }, false, t)
    return ProcessingStep.getUuid(processingStep)
  })

// ====== READ - Chain

export { countChainsBySurveyId, fetchChainsBySurveyId, fetchChainByUuid } from '../repository/processingChainRepository'

// ====== READ - Steps

export { fetchStepsByChainUuid } from '../repository/processingStepRepository'

// ====== UPDATE

export const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
    ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainPropUpdate,
      { uuid: processingChainUuid, key, value }, false, t)
  ]))

// ====== DELETE

export const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t),
    ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, { uuid: processingChainUuid }, false, t)
  ]))
