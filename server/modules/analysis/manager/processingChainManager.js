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

// ====== CREATE OR UPDATE Chain

const _insertChain = async (user, surveyId, chain, t) => {
  const chainDb = await ProcessingChainRepository.insertChain(surveyId, chain, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, chainDb, false, t)
}

const _updateChainProps = async (user, surveyId, chain, chainDb, t) => {
  const propsToUpdate = ProcessingChain.getPropsDiff(chain)(chainDb)
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

// ====== CREATE OR UPDATE - Step

const _insertStep = async (user, surveyId, step, t) => {
  const stepDb = await ProcessingStepRepository.insertStep(surveyId, step, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, stepDb, false, t)
}

const _updateStepProps = async (user, surveyId, step, stepDb, t) => {
  const propsToUpdate = ProcessingStep.getPropsDiff(step)(stepDb)
  for (const [key, value] of Object.entries(propsToUpdate)) {
    const processingStepUuid = ProcessingStep.getUuid(step)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(step),
      key,
      value,
    }
    await Promise.all([
      ProcessingStepRepository.updateStepProp(surveyId, processingStepUuid, key, value, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepPropUpdate, logContent, false, t),
    ])
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

// ====== CREATE OR UPDATE - Calculation

const _insertCalculation = async (user, surveyId, chain, calculation, t) => {
  const calculationDb = await ProcessingStepCalculationRepository.insertCalculationStep(surveyId, calculation, t)
  const logContent = {
    ...calculationDb,
    [ActivityLog.keysContent.processingChainUuid]: ProcessingChain.getUuid(chain),
  }
  await ActivityLogRepository.insert(
    user,
    surveyId,
    ActivityLog.type.processingStepCalculationCreate,
    logContent,
    false,
    t,
  )
}

export const _updateCalculation = async (user, surveyId, chain, calculation, calculationDb, t) => {
  const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
  const nodeDefUuidDb = ProcessingStepCalculation.getNodeDefUuid(calculationDb)
  const propsDiff = ProcessingStepCalculation.getPropsDiff(calculation)(calculationDb)

  if (nodeDefUuid !== nodeDefUuidDb || !R.isEmpty(propsDiff)) {
    const calculationUpdated = await ProcessingStepCalculationRepository.updateCalculationStep(surveyId, calculation, t)
    const logContent = {
      ...calculationUpdated,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingChain.getUuid(chain),
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationUpdate,
      logContent,
      false,
      t,
    )
  }
}

const _insertOrUpdateCalculation = async (user, surveyId, chain, calculation, t) => {
  const calculationDb = await ProcessingStepCalculationRepository.fetchCalculationByUuid(
    surveyId,
    ProcessingStepCalculation.getUuid(calculation),
    t,
  )
  if (calculationDb) {
    await _updateCalculation(user, surveyId, chain, calculation, calculationDb, t)
  } else {
    await _insertCalculation(user, surveyId, chain, calculation, t)
  }
}

const _updateCalculationIndexes = async (user, surveyId, step, t) => {
  const calculationUuids = ProcessingStep.getCalculationUuids(step)
  const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(
    surveyId,
    ProcessingStep.getUuid(step),
    t,
  )
  // Await ProcessingStepCalculationRepository.incrementCalculationIndexesByStepUuid(surveyId,ProcessingStep.getUuid(step), calculations.length, t)
  // await ProcessingStepCalculationRepository.updateCalculationIndexesByUuids(surveyId, calculationUuids, t)
  for (const calculation of calculations) {
    const calculationUuid = ProcessingStepCalculation.getUuid(calculation)
    const indexFrom = ProcessingStepCalculation.getIndex(calculation)
    const indexTo = R.indexOf(calculationUuid, calculationUuids)
    if (indexFrom !== indexTo) {
      const logContent = {
        [ActivityLog.keysContent.uuid]: ProcessingStepCalculation.getUuid(calculation),
        [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(step),
        [ActivityLog.keysContent.processingStepUuid]: ProcessingStep.getUuid(step),
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
    }
  }
}

// ====== READ - Chain

export { countChainsBySurveyId, fetchChainsBySurveyId, fetchChainByUuid } from '../repository/processingChainRepository'

// ====== READ - Steps

export { fetchStepsByChainUuid, fetchStepSummaryByIndex } from '../repository/processingStepRepository'

// ====== READ - Calculations

export { fetchCalculationsByStepUuid } from '../repository/processingStepCalculationRepository'

// ====== UPDATE - Chain

export const updateChain = async (user, surveyId, chain, step = null, calculation = null, client = db) => {
  await client.tx(async t => {
    await _insertOrUpdateChain(user, surveyId, chain, t)

    if (step) {
      await _insertOrUpdateStep(user, surveyId, step, t)
      if (calculation) {
        await _insertOrUpdateCalculation(user, surveyId, chain, calculation, t)
      }

      await _updateCalculationIndexes(user, surveyId, step, t)
    }
  })
}

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

export const deleteStep = async (user, surveyId, processingStepUuid, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, processingStepUuid, t)
    const processingStepNext = await ProcessingStepRepository.fetchStepSummaryByIndex(
      surveyId,
      ProcessingStep.getProcessingChainUuid(processingStep),
      ProcessingStep.getIndex(processingStep) + 1,
      t,
    )
    if (processingStepNext) {
      throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')
    }

    const logContent = {
      [ActivityLog.keysContent.uuid]: processingStepUuid,
      [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(processingStep),
      [ActivityLog.keysContent.index]: ProcessingStep.getIndex(processingStep),
    }
    await Promise.all([
      ProcessingStepRepository.deleteStep(surveyId, processingStepUuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t),
    ])
  })

// ====== DELETE - Calculation

export const deleteCalculation = async (user, surveyId, processingStepUuid, calculationUuid, client = db) =>
  await client.tx(async t => {
    const processingStep = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, processingStepUuid, t)
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
