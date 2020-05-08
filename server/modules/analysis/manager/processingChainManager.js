import * as R from 'ramda'
import * as pgPromise from 'pg-promise'

import { db } from '@server/db/db'
import SystemError from '@core/systemError'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as ChainRepository from '../repository/chain'
import * as StepRepository from '../repository/step'
import * as ProcessingChainRepository from '../repository/processingChainRepository'
import * as ProcessingStepRepository from '../repository/processingStepRepository'
import * as ProcessingStepCalculationRepository from '../repository/processingStepCalculationRepository'

/**
 * Marks survey as draft and deletes unused node def analysis. //TODO: Shouldn't the unused nodeDefs be removed only on survey publish?
 *
 * @param {string} surveyId - The survey id.
 * @param {pgPromise.IDatabase} t - The database client.
 * @param {boolean} [deleteNodeDefAnalysisUnused=false] - Whether to delete the unused nodeDef analysis.
 *
 * @returns {Array} - The uuids of deleted unused node defs analysis.
 */
const _afterChainUpdate = async (surveyId, t, deleteNodeDefAnalysisUnused = true) => {
  const [nodeDefAnalysisDeletedUudis] = await Promise.all([
    ...(deleteNodeDefAnalysisUnused ? [NodeDefRepository.deleteNodeDefsAnalysisUnused(surveyId, t)] : []),
    markSurveyDraft(surveyId, t),
  ])
  return nodeDefAnalysisDeletedUudis
}

// ====== CREATE OR UPDATE Chain

const _insertChain = async (user, surveyId, chain, t) => {
  const chainDb = await ProcessingChainRepository.insertChain(surveyId, chain, t)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, chainDb, false, t)
}

const _updateChainProps = async (user, surveyId, chain, chainDb, t) => {
  const processingChainUuid = Chain.getUuid(chain)
  const propsToUpdate = Chain.getPropsDiff(chain)(chainDb)
  await Promise.all(
    Object.entries(propsToUpdate)
      .map(([key, value]) => [
        ProcessingChainRepository.updateChainProp(surveyId, processingChainUuid, key, value, t),
        ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.processingChainPropUpdate,
          { [ActivityLog.keysContent.uuid]: processingChainUuid, key, value },
          false,
          t
        ),
      ])
      .flat()
  )
  // Update processing_chain validation and date_modified
  await ProcessingChainRepository.updateChainValidation(surveyId, processingChainUuid, Chain.getValidation(chain), t)
}

const _insertOrUpdateChain = async (user, surveyId, chain, client) => {
  const chainDb = await ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain) }, client)
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
  const propsToUpdate = Step.getPropsDiff(step)(stepDb)
  await Promise.all(
    Object.entries(propsToUpdate)
      .map(([key, value]) => {
        const processingStepUuid = Step.getUuid(step)
        const logContent = {
          [ActivityLog.keysContent.uuid]: processingStepUuid,
          [ActivityLog.keysContent.processingChainUuid]: Step.getProcessingChainUuid(step),
          key,
          value,
        }
        return [
          ProcessingStepRepository.updateStepProp(surveyId, processingStepUuid, key, value, t),
          ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepPropUpdate, logContent, false, t),
        ]
      })
      .flat()
  )
}

const _insertOrUpdateStep = async (user, surveyId, step, t) => {
  const stepDb = await StepRepository.fetchStep({ surveyId, stepUuid: Step.getUuid(step) }, t)
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
    [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
  }
  await ActivityLogRepository.insert(
    user,
    surveyId,
    ActivityLog.type.processingStepCalculationCreate,
    logContent,
    false,
    t
  )
}

const _updateCalculation = async (user, surveyId, chain, calculation, calculationDb, t) => {
  const nodeDefUuid = Calculation.getNodeDefUuid(calculation)
  const nodeDefUuidDb = Calculation.getNodeDefUuid(calculationDb)
  const propsDiff = Calculation.getPropsDiff(calculation)(calculationDb)

  if (nodeDefUuid !== nodeDefUuidDb || !R.isEmpty(propsDiff)) {
    const calculationUpdated = await ProcessingStepCalculationRepository.updateCalculationStep(surveyId, calculation, t)
    const logContent = {
      ...calculationUpdated,
      [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
    }
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationUpdate,
      logContent,
      false,
      t
    )
  }
}

const _insertOrUpdateCalculation = async (user, surveyId, chain, calculation, t) => {
  const calculationDb = await ProcessingStepCalculationRepository.fetchCalculationByUuid(
    surveyId,
    Calculation.getUuid(calculation),
    t
  )
  if (calculationDb) {
    await _updateCalculation(user, surveyId, chain, calculation, calculationDb, t)
  } else {
    await _insertCalculation(user, surveyId, chain, calculation, t)
  }
}

const _updateCalculationIndexes = async (user, surveyId, step, t) => {
  const stepUuid = Step.getUuid(step)
  const calculationUuids = Step.getCalculationUuids(step)
  const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid, t)
  const calculationsDbUuids = R.pluck(Calculation.keys.uuid, calculations)
  if (R.equals(calculationsDbUuids, calculationUuids)) {
    // Calculation indexes  not changed
    return
  }

  // Update indexes in db
  await ProcessingStepCalculationRepository.incrementCalculationIndexesByStepUuid(
    surveyId,
    stepUuid,
    calculations.length,
    t
  )
  await ProcessingStepCalculationRepository.updateCalculationIndexesByUuids(surveyId, calculationUuids, t)

  // Insert activity logs
  await Promise.all(
    calculations.map((calculation) => {
      const calculationUuid = Calculation.getUuid(calculation)
      const indexFrom = Calculation.getIndex(calculation)
      const indexTo = R.indexOf(calculationUuid, calculationUuids)
      if (indexFrom !== indexTo) {
        const logContent = {
          [ActivityLog.keysContent.uuid]: calculationUuid,
          [ActivityLog.keysContent.processingChainUuid]: Step.getProcessingChainUuid(step),
          [ActivityLog.keysContent.processingStepUuid]: stepUuid,
          [ActivityLog.keysContent.indexFrom]: indexFrom,
          [ActivityLog.keysContent.indexTo]: indexTo,
        }
        return ActivityLogRepository.insert(
          user,
          surveyId,
          ActivityLog.type.processingStepCalculationIndexUpdate,
          logContent,
          false,
          t
        )
      }
      return null
    })
  )
}

// ====== READ - Calculations

export {
  fetchCalculationAttributeUuidsByStepUuid,
  fetchCalculationAttributeUuidsByChainUuid,
  fetchCalculationAttributeUuidsByChainUuidExcluded,
} from '../repository/processingStepCalculationRepository'

// ====== UPDATE - Chain

export const updateChain = async (user, surveyId, chain, step = null, calculation = null, client = db) => {
  await client.tx(async (t) => {
    await _insertOrUpdateChain(user, surveyId, chain, t)

    if (step) {
      await _insertOrUpdateStep(user, surveyId, step, t)
      if (calculation) {
        await _insertOrUpdateCalculation(user, surveyId, chain, calculation, t)
      }

      await _updateCalculationIndexes(user, surveyId, step, t)
    }

    // Validate chain / step / calculation after insert/update
    // TODO: Why, while editing a processing chain, does the user fetch published props first? shouldn't he always fetch draft props?
    let surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, false, t)
    if (!Survey.isPublished(surveyInfo)) {
      // Fetch draft survey props
      surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, true, t)
    }

    const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)
    const calculationValidation = calculation
      ? await ChainValidator.validateCalculation(calculation, surveyDefaultLang)
      : Validation.newInstance()

    let stepValidation = null
    const chainDb = await ChainRepository.fetchChain(
      { surveyId, chainUuid: Chain.getUuid(chain), includeStepsAndCalculations: true },
      t
    )
    if (step) {
      const stepDb = Chain.getStepByIdx(Step.getIndex(step))(chainDb)
      stepValidation = await ChainValidator.validateStep(stepDb)
    }

    const chainValidation = await ChainValidator.validateChain(chainDb, surveyDefaultLang)

    if (!R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      // Throw error to rollback transaction
      throw new SystemError('appErrors.processingChainCannotBeSaved')
    }

    return _afterChainUpdate(surveyId, t, false)
  })
}

export {
  removeCyclesFromChains,
  updateChainScriptCommon,
  deleteChainsWithoutCycles,
} from '../repository/processingChainRepository'

// ====== DELETE - Chain

// Deletes a processing chain.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteChain = async (user, surveyId, processingChainUuid, client = db) =>
  client.tx(async (t) => {
    const processingChain = await ProcessingChainRepository.deleteChain(surveyId, processingChainUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: processingChainUuid,
      [ActivityLog.keysContent.labels]: Chain.getLabels(processingChain),
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, logContent, false, t)

    return _afterChainUpdate(surveyId, t)
  })

// ====== DELETE - Step

// Deletes a processing step.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteStep = async (user, surveyId, stepUuid, client = db) =>
  client.tx(async (t) => {
    const step = await StepRepository.fetchStep({ surveyId, stepUuid }, t)

    const chainUuid = Step.getProcessingChainUuid(step)
    const stepNext = await StepRepository.fetchStep({ surveyId, chainUuid, stepIndex: Step.getIndex(step) + 1 }, t)
    if (stepNext) {
      throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')
    }

    const logContent = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.index]: Step.getIndex(step),
    }
    await Promise.all([
      ProcessingStepRepository.deleteStep(surveyId, stepUuid, t),
      ProcessingChainRepository.updateChainDateModified(surveyId, chainUuid, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t),
    ])

    if (Step.getIndex(step) === 0) {
      // Deleted processing step was the only one, chain validation must be updated (steps are required)
      const chain = await ChainRepository.fetchChain({ surveyId, chainUuid }, t)
      const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, false, t)
      const chainValidation = await ChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
      const chainUpdated = Chain.assocItemValidation(chainUuid, chainValidation)(chain)
      await ProcessingChainRepository.updateChainValidation(surveyId, chainUuid, Chain.getValidation(chainUpdated), t)
    }

    return _afterChainUpdate(surveyId, t)
  })

// ====== DELETE - Calculation

// Deletes a processing step calculation.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteCalculation = async (user, surveyId, stepUuid, calculationUuid, client = db) =>
  client.tx(async (t) => {
    const step = await StepRepository.fetchStep({ surveyId, stepUuid }, t)
    const chainUuid = Step.getProcessingChainUuid(step)

    const calculation = await ProcessingStepCalculationRepository.deleteCalculationStep(
      surveyId,
      stepUuid,
      calculationUuid,
      t
    )

    const logContent = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.processingStepUuid]: stepUuid,
      [ActivityLog.keysContent.processingStepIndex]: Step.getIndex(step),
      [ActivityLog.keysContent.index]: Calculation.getIndex(calculation),
      [ActivityLog.keysContent.labels]: Calculation.getLabels(calculation),
    }

    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.processingStepCalculationDelete,
      logContent,
      false,
      t
    )

    // Update step validation
    const calculations = await ProcessingStepCalculationRepository.fetchCalculationsByStepUuid(surveyId, stepUuid, t)
    const stepUpdated = Step.assocCalculations(calculations)(step)
    const stepValidation = await ChainValidator.validateStep(stepUpdated)
    const chain = await ChainRepository.fetchChain({ surveyId, chainUuid }, t)
    const chainUpdated = Chain.assocItemValidation(stepUuid, stepValidation)(chain)

    // Update processing_chain validation and date_modified
    await ProcessingChainRepository.updateChainValidation(surveyId, chainUuid, Chain.getValidation(chainUpdated), t)

    return _afterChainUpdate(surveyId, t)
  })
