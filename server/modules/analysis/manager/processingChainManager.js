import * as R from 'ramda'

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

// ====== Chain

const _insertChain = async (user, surveyId, chain, t) => {
  const chainDb = await ProcessingChainRepository.insertChain(surveyId, chain, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, chainDb, false, t)
}

const _updateChainProps = async (user, surveyId, chain, chainDb, t) => {
  const propsNew = ProcessingChain.getProps(chain)
  const propsExisting = ProcessingChain.getProps(chainDb)
  const propsToUpdate = R.fromPairs(R.difference(R.toPairs(propsNew), R.toPairs(propsExisting)))

  for (const [key, value] of Object.entries(propsToUpdate)) {
    const processingChainUuid = ProcessingChain.getUuid(chain)
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
    ])
  }
}

const _insertOrUpdateChain = async (user, surveyId, chain, client) => {
  const chainDb = await ProcessingChainRepository.fetchChainByUuid(surveyId, ProcessingChain.getUuid(chain), client)
  if (chainDb) {
    // UPDATE CHAIN
    await _updateChainProps(user, surveyId, chain, chainDb, client)
  } else {
    // CREATE CHAIN
    await _insertChain(user, surveyId, chain, client)
  }
}

// ====== CREATE - Processing Step

const _insertStep = async (user, surveyId, step, t) => {
  const stepDb = await ProcessingStepRepository.insertStep(surveyId, step, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, stepDb, false, t)
}

const _updateStepProps = async (user, surveyId, step, stepDb, t) => {
  const propsNew = ProcessingStep.getProps(step)
  const propsExisting = ProcessingStep.getProps(stepDb)
  const propsToUpdate = R.fromPairs(R.difference(R.toPairs(propsNew), R.toPairs(propsExisting)))

  for (const [key, value] of Object.entries(propsToUpdate)) {
    const processingStepUuid = ProcessingStep.getUuid(step)

    const processingStepDb = await ProcessingStepRepository.updateStepProp(surveyId, processingStepUuid, key, value, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStepDb),
      key,
      value,
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepPropUpdate, logContent, false, t)
  }
}

const _insertOrUpdateStep = async (user, surveyId, step, t) => {
  const stepDb = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, ProcessingStep.getUuid(step), t)
  if (stepDb) {
    await _updateStepProps(user, surveyId, step, stepDb, t)
  } else {
    await _insertStep(user, surveyId, step, t)
  }
}

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

export const updateChain = async (user, surveyId, chain, step = null, client = db) => {
  await client.tx(async t => {
    await _insertOrUpdateChain(user, surveyId, chain, t)

    if (step) {
      await _insertOrUpdateStep(user, surveyId, step, t)
    }
  })
}

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
