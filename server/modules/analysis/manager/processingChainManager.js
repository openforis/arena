import * as R from 'ramda'

import { db } from '@server/db/db'
import SystemError from '@core/systemError'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingChainValidator from '@common/analysis/processingChainValidator'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'

import * as ProcessingChainRepository from '../repository/processingChainRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as ProcessingStepCalculationRepository from '../repository/processingStepCalculationRepository'

// ====== CREATE OR UPDATE Chain

const _insertChain = async (user, surveyId, chain, t) => {
  const chainDb = await ProcessingChainRepository.insertChain(surveyId, chain, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, chainDb, false, t)
}

const _updateChainProps = async (user, surveyId, chain, chainDb, t) => {
  const processingChainUuid = ProcessingChain.getUuid(chain)
  const propsToUpdate = ProcessingChain.getPropsDiff(chain)(chainDb)
  for (const [key, value] of Object.entries(propsToUpdate)) {
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

  // Update processing_chain validation and date_modified
  await ProcessingChainRepository.updateChainValidation(
    surveyId,
    processingChainUuid,
    ProcessingChain.getValidation(chain),
    t,
  )
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
  const stepUuid = ProcessingStep.getUuid(step)
  const calculationUuids = ProcessingStep.getCalculationUuids(step)
  const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid, t)
  const calculationsDbUuids = R.pluck(ProcessingStepCalculation.keys.uuid, calculations)
  if (R.equals(calculationsDbUuids, calculationUuids)) {
    // Calculation indexes  not changed
    return
  }

  // Update indexes in db
  await ProcessingStepCalculationRepository.incrementCalculationIndexesByStepUuid(
    surveyId,
    stepUuid,
    calculations.length,
    t,
  )
  await ProcessingStepCalculationRepository.updateCalculationIndexesByUuids(surveyId, calculationUuids, t)

  // Insert activity logs
  for (const calculation of calculations) {
    const calculationUuid = ProcessingStepCalculation.getUuid(calculation)
    const indexFrom = ProcessingStepCalculation.getIndex(calculation)
    const indexTo = R.indexOf(calculationUuid, calculationUuids)
    if (indexFrom !== indexTo) {
      const logContent = {
        [ActivityLog.keysContent.uuid]: calculationUuid,
        [ActivityLog.keysContent.processingChainUuid]: ProcessingStep.getProcessingChainUuid(step),
        [ActivityLog.keysContent.processingStepUuid]: stepUuid,
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

export {
  fetchCalculationsByStepUuid,
  fetchCalculationAttributeUuidsByStepUuid,
  fetchCalculationAttributeUuidsByChainUuid,
} from '../repository/processingStepCalculationRepository'

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

    // Validate chain / step / calculation after insert/update
    const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, false, t)
    const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)
    const calculationValidation = calculation
      ? await ProcessingChainValidator.validateCalculation(calculation, surveyDefaultLang)
      : Validation.newInstance()

    let stepValidation = null
    if (step) {
      const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(
        surveyId,
        ProcessingStep.getUuid(step),
        t,
      )
      stepValidation = await ProcessingChainValidator.validateStep(ProcessingStep.assocCalculations(calculations)(step))
    }

    const steps = await ProcessingStepRepository.fetchStepsByChainUuid(surveyId, ProcessingChain.getUuid(chain), t)
    const chainValidation = await ProcessingChainValidator.validateChain(
      ProcessingChain.assocProcessingSteps(steps)(chain),
      surveyDefaultLang,
    )

    if (!R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      // Throw error to rollabck transaction
      throw new SystemError('appErrors.processingChainCannotBeSaved')
    }
  })
}

export { removeCyclesFromChains, deleteChainsWithoutCycles } from '../repository/processingChainRepository'

// ====== DELETE - Chain

/**
 * Deletes a processing chain.
 * It returns a list of deleted unused node def analysis uuids (if any)
 */
export const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  await client.tx(async t => {
    const processingChain = await ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingChainUuid,
      [ActivityLog.keysContent.labels]: ProcessingChain.getLabels(processingChain),
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, logContent, false, t)

    // Delete unused node defs analysis
    return await NodeDefRepository.deleteNodeDefsAnalysisUnused(surveyId, t)
  })

// ====== DELETE - Step

/**
 * Deletes a processing step.
 * It returns a list of deleted unused node def analysis uuids (if any)
 */
export const deleteStep = async (user, surveyId, stepUuid, client = db) =>
  await client.tx(async t => {
    const step = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid, t)
    const chainUuid = ProcessingStep.getProcessingChainUuid(step)
    const stepNext = await ProcessingStepRepository.fetchStepSummaryByIndex(
      surveyId,
      chainUuid,
      ProcessingStep.getIndex(step) + 1,
      t,
    )
    if (stepNext) {
      throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')
    }

    const logContent = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.index]: ProcessingStep.getIndex(step),
    }
    await Promise.all([
      ProcessingStepRepository.deleteStep(surveyId, stepUuid, t),
      ProcessingChainRepository.updateChainDateModified(surveyId, chainUuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t),
    ])

    if (ProcessingStep.getIndex(step) === 0) {
      // Deleted processing step was the only one, chain validation must be updated (steps are required)
      const chain = await ProcessingChainRepository.fetchChainByUuid(surveyId, chainUuid, t)
      const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, false, t)
      const chainValidation = await ProcessingChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
      const chainUpdated = ProcessingChain.assocItemValidation(chainUuid, chainValidation)(chain)
      await ProcessingChainRepository.updateChainValidation(
        surveyId,
        chainUuid,
        ProcessingChain.getValidation(chainUpdated),
        t,
      )
    }

    // Delete unused node defs analysis
    return await NodeDefRepository.deleteNodeDefsAnalysisUnused(surveyId, t)
  })

// ====== DELETE - Calculation

/**
 * Deletes a processing step calculation.
 * It returns a list of deleted unused node def analysis uuids (if any)
 */
export const deleteCalculation = async (user, surveyId, stepUuid, calculationUuid, client = db) =>
  await client.tx(async t => {
    const step = await ProcessingStepRepository.fetchStepSummaryByUuid(surveyId, stepUuid, t)
    const chainUuid = ProcessingStep.getProcessingChainUuid(step)

    const calculation = await ProcessingStepCalculationRepository.deleteCalculationStep(
      surveyId,
      stepUuid,
      calculationUuid,
      t,
    )

    const logContent = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.processingStepUuid]: stepUuid,
      [ActivityLog.keysContent.processingStepIndex]: ProcessingStep.getIndex(step),
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

    // Update step validation
    const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid, t)
    const stepUpdated = ProcessingStep.assocCalculations(calculations)(step)
    const stepValidation = await ProcessingChainValidator.validateStep(stepUpdated)
    const chain = await ProcessingChainRepository.fetchChainByUuid(surveyId, chainUuid, t)
    const chainUpdated = ProcessingChain.assocItemValidation(stepUuid, stepValidation)(chain)
    // Update processing_chain validation and date_modified
    await ProcessingChainRepository.updateChainValidation(
      surveyId,
      chainUuid,
      ProcessingChain.getValidation(chainUpdated),
      t,
    )

    // Delete unused node defs analysis
    return await NodeDefRepository.deleteNodeDefsAnalysisUnused(surveyId, t)
  })

// ===== GRANT PRIVILEGES

export { grantUpdateOnProcessingChainStatusToUser } from '../repository/processingChainRepository'
