import db from '@server/db/db'
import SystemError from '@core/systemError'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as ProcessingChainRepository from '../repository/processingChainRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'

// ====== CREATE - Chain

export const createChain = async (user, surveyId, cycle, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, processingChain, false, t)
    return ProcessingChain.getUuid(processingChain)
  })

// ====== CREATE - Step

export const createStep = async (user, surveyId, processingChainUuid, processingStepIndex, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.insertStep(surveyId, processingChainUuid, processingStepIndex, t)
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, processingStep, false, t)
    return ProcessingStep.getUuid(processingStep)
  })

// ====== READ - Chain

export { countChainsBySurveyId, fetchChainsBySurveyId, fetchChainByUuid } from '../repository/processingChainRepository'

// ====== READ - Steps

export { fetchStepsByChainUuid, fetchStepByUuid, fetchStepSummaryByIndex } from '../repository/processingStepRepository'

// ====== UPDATE - Chain

export const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) =>
  await client.tx(async t => await Promise.all([
    ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
    ActivityLogRepository.insert(
      user, surveyId, ActivityLog.type.processingChainPropUpdate,
      { [ActivityLog.keysContent.uuid]: processingChainUuid, key, value }, false, t
    )
  ]))

// ====== UPDATE - Step

export const updateStepProps = async (user, surveyId, processingStepUuid, props, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.updateStepProps(surveyId, processingStepUuid, props, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
      ...props
    }
    await ActivityLogRepository.insert(
      user, surveyId, ActivityLog.type.processingStepPropsUpdate, logContent, false, t)
  })

// ====== DELETE - Chain

export const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingChainUuid,
      [ActivityLog.keysContent.labels]: ProcessingChain.getLabels(processingChain)
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, logContent, false, t)
  })

// ====== DELETE - Step

export const deleteStep = async (user, surveyId, processingStepUuid, client = db) => {
  const processingStep = await ProcessingStepRepository.fetchStepByUuid(surveyId, processingStepUuid)
  const processingStepNext = await ProcessingStepRepository.fetchStepSummaryByIndex(surveyId, ProcessingStep.getProcessingChainUuid(processingStep), ProcessingStep.getIndex(processingStep) + 1)
  if (!!processingStepNext)
    throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')

  const logContent = {
    [ActivityLog.keysContent.uuid]: processingStepUuid,
    [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
    [ActivityLog.keysContent.index]: ProcessingStep.getIndex(processingStep),
  }
  await client.tx(async t => await Promise.all([
    ProcessingStepRepository.deleteStep(surveyId, processingStepUuid, t),
    ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t)
  ]))
}
