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
import { TableChain, TableStep } from '@common/model/db'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as ChainRepository from '../repository/chain'
import * as StepRepository from '../repository/step'
import * as CalculationRepository from '../repository/calculation'
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

const _insertChain = async ({ user, surveyId, chain }, client) => {
  const chainDb = await ChainRepository.insertChain({ surveyId, chain }, client)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainCreate, chainDb, false, client)
}

const _updateChain = async ({ user, surveyId, chain, chainDb }, client) => {
  const chainUuid = Chain.getUuid(chain)
  const propsToUpdate = Chain.getPropsDiff(chain)(chainDb)
  // activity log for each updated prop
  const promises = Object.entries(propsToUpdate).map(([key, value]) => {
    const content = { [ActivityLog.keysContent.uuid]: chainUuid, key, value }
    const type = ActivityLog.type.processingChainPropUpdate
    return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
  })
  // chain props and validation update
  const fields = {
    [TableChain.columnSet.props]: propsToUpdate,
    [TableChain.columnSet.validation]: Chain.getValidation(chain),
  }
  const params = { surveyId, chainUuid, dateModified: true, fields }
  promises.push(ChainRepository.updateChain(params, client))

  return Promise.all(promises)
}

const _insertOrUpdateChain = async ({ user, surveyId, chain }, client) => {
  const chainDb = await ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain) }, client)
  return chainDb
    ? _updateChain({ user, surveyId, chain, chainDb }, client)
    : _insertChain({ user, surveyId, chain }, client)
}

// ====== CREATE OR UPDATE - Step

const _insertStep = async ({ user, surveyId, step }, client) => {
  const stepDb = await StepRepository.insertStep({ surveyId, step }, client)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, stepDb, false, client)
}

const _getUpdateCalculationIndexes = ({ user, surveyId, step, stepDb }, client) => {
  const stepUuid = Step.getUuid(step)
  const calculationUuids = Step.getCalculationUuids(step)
  const calculationsDbUuids = Step.getCalculations(stepDb).map(Calculation.getUuid)
  const calculationsDb = Step.getCalculations(stepDb)
  const promises = []
  // Calculation indexes haven't changed
  if (!R.equals(calculationsDbUuids, calculationUuids)) {
    promises.push(CalculationRepository.updateCalculationIndexes({ surveyId, stepUuid, calculationUuids }, client))
    // Insert activity logs
    promises.push(
      ...calculationsDb.map((calculation) => {
        const calculationUuid = Calculation.getUuid(calculation)
        const indexFrom = Calculation.getIndex(calculation)
        const indexTo = R.indexOf(calculationUuid, calculationUuids)
        if (indexFrom !== indexTo) {
          const content = {
            [ActivityLog.keysContent.uuid]: calculationUuid,
            [ActivityLog.keysContent.processingChainUuid]: Step.getProcessingChainUuid(step),
            [ActivityLog.keysContent.processingStepUuid]: stepUuid,
            [ActivityLog.keysContent.indexFrom]: indexFrom,
            [ActivityLog.keysContent.indexTo]: indexTo,
          }
          const type = ActivityLog.type.processingStepCalculationIndexUpdate
          return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
        }
        return null
      })
    )
  }
  return promises
}

const _updateStep = async ({ user, surveyId, step, stepDb }, client) => {
  const chainUuid = Step.getProcessingChainUuid(step)
  const stepUuid = Step.getUuid(step)
  const promises = []

  // update props
  const propsToUpdate = Step.getPropsDiff(step)(stepDb)
  const entries = Object.entries(propsToUpdate)
  if (entries.length > 0) {
    promises.push(
      ...entries.map(([key, value]) => {
        const content = {
          [ActivityLog.keysContent.uuid]: stepUuid,
          [ActivityLog.keysContent.processingChainUuid]: chainUuid,
          key,
          value,
        }
        const type = ActivityLog.type.processingStepPropUpdate
        return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
      })
    )
    const fields = { [TableStep.columnSet.props]: propsToUpdate }
    promises.push(StepRepository.updateStep({ surveyId, stepUuid, fields }, client))
  }

  promises.push(..._getUpdateCalculationIndexes({ user, surveyId, step, stepDb }, client))

  return Promise.all(promises)
}

const _insertOrUpdateStep = async ({ user, surveyId, step }, client) => {
  const stepDb = await StepRepository.fetchStep(
    { surveyId, stepUuid: Step.getUuid(step), includeCalculations: true },
    client
  )
  return stepDb ? _updateStep({ user, surveyId, step, stepDb }, client) : _insertStep({ user, surveyId, step }, client)
}

// ====== CREATE OR UPDATE - Calculation

const _insertCalculation = async (user, surveyId, chain, calculation, client) => {
  const calculationDb = await ProcessingStepCalculationRepository.insertCalculationStep(surveyId, calculation, client)
  const content = {
    ...calculationDb,
    [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
  }
  const type = ActivityLog.type.processingStepCalculationCreate
  await ActivityLogRepository.insert(user, surveyId, type, content, false, client)
}

const _updateCalculation = async (user, surveyId, chain, calculation, calculationDb, client) => {
  const nodeDefUuid = Calculation.getNodeDefUuid(calculation)
  const nodeDefUuidDb = Calculation.getNodeDefUuid(calculationDb)
  const propsDiff = Calculation.getPropsDiff(calculation)(calculationDb)

  if (nodeDefUuid !== nodeDefUuidDb || !R.isEmpty(propsDiff)) {
    const calculationUpdated = await ProcessingStepCalculationRepository.updateCalculationStep(
      surveyId,
      calculation,
      client
    )
    const content = {
      ...calculationUpdated,
      [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
    }
    const type = ActivityLog.type.processingStepCalculationUpdate
    await ActivityLogRepository.insert(user, surveyId, type, content, false, client)
  }
}

const _insertOrUpdateCalculation = async (user, surveyId, chain, calculation, client) => {
  const calculationDb = await ProcessingStepCalculationRepository.fetchCalculationByUuid(
    surveyId,
    Calculation.getUuid(calculation),
    client
  )
  if (calculationDb) {
    await _updateCalculation(user, surveyId, chain, calculation, calculationDb, client)
  } else {
    await _insertCalculation(user, surveyId, chain, calculation, client)
  }
}

// ====== UPDATE - Chain

export const updateChain = async ({ user, surveyId, chain, step = null, calculation = null }, client = db) => {
  await client.tx(async (tx) => {
    await _insertOrUpdateChain({ user, surveyId, chain }, tx)

    if (step) {
      if (calculation) {
        await _insertOrUpdateCalculation(user, surveyId, chain, calculation, tx)
      }
      await _insertOrUpdateStep({ user, surveyId, step }, tx)
    }

    // Validate chain / step / calculation after insert/update
    const [surveyInfo, chainDb] = await Promise.all([
      SurveyRepository.fetchSurveyById(surveyId, true, tx),
      ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain), includeStepsAndCalculations: true }, tx),
    ])

    const defaultLanguage = Survey.getDefaultLanguage(surveyInfo)
    const calculationValidation = calculation
      ? await ChainValidator.validateCalculation(calculation, defaultLanguage)
      : Validation.newInstance()

    let stepValidation = null
    if (step) {
      const stepDb = Chain.getStepByIdx(Step.getIndex(step))(chainDb)
      stepValidation = await ChainValidator.validateStep(stepDb)
    }

    const chainValidation = await ChainValidator.validateChain(chainDb, defaultLanguage)

    if (!R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      // Throw error to rollback transaction
      throw new SystemError('appErrors.processingChainCannotBeSaved')
    }

    return _afterChainUpdate(surveyId, tx, false)
  })
}

export { removeCyclesFromChains, deleteChainsWithoutCycles } from '../repository/processingChainRepository'

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
      ChainRepository.updateChain({ surveyId, chainUuid, dateModified: true }, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, logContent, false, t),
    ])

    if (Step.getIndex(step) === 0) {
      // Deleted processing step was the only one, chain validation must be updated (steps are required)
      const [surveyInfo, chain] = await Promise.all([
        SurveyRepository.fetchSurveyById(surveyId, false, t),
        ChainRepository.fetchChain({ surveyId, chainUuid }, t),
      ])
      const chainValidation = await ChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
      const chainUpdated = Chain.assocItemValidation(chainUuid, chainValidation)(chain)
      const fields = { [TableChain.columnSet.validation]: Chain.getValidation(chainUpdated) }
      await ChainRepository.updateChain({ surveyId, chainUuid, fields }, t)
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

    // insert activity log
    const content = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.processingStepUuid]: stepUuid,
      [ActivityLog.keysContent.processingStepIndex]: Step.getIndex(step),
      [ActivityLog.keysContent.index]: Calculation.getIndex(calculation),
      [ActivityLog.keysContent.labels]: Calculation.getLabels(calculation),
    }
    const type = ActivityLog.type.processingStepCalculationDelete
    await ActivityLogRepository.insert(user, surveyId, type, content, false, t)

    // Update step validation
    const chain = await ChainRepository.fetchChain({ surveyId, chainUuid, includeStepsAndCalculations: true }, t)
    const stepValidation = await ChainValidator.validateStep(Chain.getStepByIdx(Step.getIndex(step))(chain))
    const chainUpdated = Chain.assocItemValidation(stepUuid, stepValidation)(chain)
    // Update processing_chain validation
    const fields = { [TableChain.columnSet.validation]: Chain.getValidation(chainUpdated) }
    await ChainRepository.updateChain({ surveyId, chainUuid, fields, dateModified: true }, t)

    return _afterChainUpdate(surveyId, t)
  })
