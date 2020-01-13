import { db } from '@server/db/db'
import SystemError from '@core/systemError'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingChainRepository from '../repository/processingChainRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as ProcessingStepCalculationRepository from '../repository/processingStepCalculationRepository'

// ====== CREATE - Chain

export const createChain = async (user, surveyId, cycle, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.insertChain(surveyId, cycle, t)
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingChainCreate,
      processingChain,
      false,
      t,
    )
    return ProcessingChain.getUuid(processingChain)
  })

// ====== CREATE - Processing Step

export const createProcessingStep = async (user, surveyId, processingChainUuid, processingStepIndex, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.insertStep(
      surveyId,
      processingChainUuid,
      processingStepIndex,
      t,
    )
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, processingStep, false, t)
    return ProcessingStep.getUuid(processingStep)
  })

// ====== CREATE - Processing Step Calculation

export const insertProcessingStepCalculation = async (user, surveyId, calculation, client = db) =>
  await client.tx(async t => {
    const [calculationStepInserted, processingStep] = await Promise.all([
      ProcessingStepCalculationRepository.insertCalculationStep(surveyId, calculation, t),
      ProcessingStepRepository.fetchStepSummaryByUuid(
        surveyId,
        ProcessingStepCalculation.getProcessingStepUuid(calculation),
        t,
      ),
    ])
    const logContent = {
      ...calculationStepInserted,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationCreate,
      logContent,
      false,
      t,
    )
    return calculationStepInserted
  })

// ====== READ - Chain

export { countChainsBySurveyId, fetchChainsBySurveyId, fetchChainByUuid } from '../repository/processingChainRepository'

// ====== READ - Steps

export { fetchStepsByChainUuid, fetchStepByUuid, fetchStepSummaryByIndex } from '../repository/processingStepRepository'

// ====== UPDATE - Chain

export const updateChainProp = async (user, surveyId, processingChainUuid, key, value, client = db) =>
  await client.tx(
    async t =>
      await Promise.all([
        ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
        ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.processingChainPropUpdate,
          { [ActivityLog.keysContent.uuid]: processingChainUuid, key, value },
          false,
          t,
        ),
      ]),
  )

// ====== UPDATE - Processing Step

export const updateStepProps = async (user, surveyId, processingStepUuid, props, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.updateStepProps(surveyId, processingStepUuid, props, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
      ...props,
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepPropsUpdate, logContent, false, t)
  })

export const updateStepCalculationIndex = async (user, surveyId, processingStepUuid, indexFrom, indexTo, client = db) =>
  await client.tx(async t => {
    const calculation = await ProcessingStepCalculationRepository.updateCalculationIndex(
      surveyId,
      processingStepUuid,
      indexFrom,
      indexTo,
      t,
    )
    const processingStep = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, processingStepUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: ProcessingStepCalculation.getUuid(calculation),
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
      [ActivityLog.keysContent.processingStepUuid]: ProcessingStep.getUuid(processingStep),
      [ActivityLog.keysContent.indexFrom]: indexFrom,
      [ActivityLog.keysContent.indexTo]: indexTo,
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationIndexUpdate,
      logContent,
      false,
      t,
    )
  })

export const updateCalculationStep = async (user, surveyId, calculation, client = db) =>
  await client.tx(async t => {
    const calculationUpdated = await ProcessingStepCalculationRepository.updateCalculationStep(surveyId, calculation, t)
    const processingStepUuid = ProcessingStepCalculation.getProcessingStepUuid(calculationUpdated)
    const processingStep = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, processingStepUuid, t)
    const logContent = {
      ...calculationUpdated,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationUpdate,
      logContent,
      false,
      t,
    )
    return calculationUpdated
  })

// ====== DELETE - Chain

export const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingChainUuid,
      [ActivityLog.keysContent.labels]: ProcessingChain.getLabels(processingChain),
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, logContent, false, t)
  })

// ====== DELETE - Step

export const deleteStep = async (user, surveyId, processingStepUuid, client = db) => {
  const processingStep = await ProcessingStepRepository.fetchStepByUuid(surveyId, processingStepUuid)
  const processingStepNext = await ProcessingStepRepository.fetchStepSummaryByIndex(
    surveyId,
    ProcessingStep.getProcessingChainUuid(processingStep),
    ProcessingStep.getIndex(processingStep) + 1,
  )
  if (processingStepNext) {
    throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')
  }

  const logContent = {
    [ActivityLog.keysContent.uuid]: processingStepUuid,
    [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
    [ActivityLog.keysContent.index]: ProcessingStep.getIndex(processingStep),
  }
  await client.tx(
    async t =>
      await Promise.all([
        ProcessingStepRepository.deleteStep(surveyId, processingStepUuid, t),
        ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t),
      ]),
  )
}

// ====== DELETE - Calculation

export const deleteCalculation = async (user, surveyId, processingStepUuid, calculationUuid, client = db) => {
  const processingStep = await ProcessingStepRepository.fetchStepByUuid(surveyId, processingStepUuid)

  await client.tx(async t => {
    const calculation = await ProcessingStepCalculationRepository.deleteCalculationStep(
      surveyId,
      processingStepUuid,
      calculationUuid,
      t,
    )
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
      [ActivityLog.keysContent.processingStepUuid]: ProcessingStep.getUuid(processingStep),
      [ActivityLog.keysContent.processingStepIndex]: ProcessingStep.getIndex(processingStep),
      [ActivityLog.keysContent.index]: ProcessingStepCalculation.getIndex(calculation),
      [ActivityLog.keysContent.labels]: ProcessingStepCalculation.getLabels(calculation),
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationDelete,
      logContent,
      false,
      t,
    )
  })
}
