import * as R from 'ramda'
import * as pgPromise from 'pg-promise'

import * as DB from '@server/db'
import SystemError from '@core/systemError'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import { TableChain, TableStep, TableCalculation } from '@common/model/db'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as ChainRepository from '../repository/chain'
import * as StepRepository from '../repository/step'
import * as CalculationRepository from '../repository/calculation'

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

const _updateStep = async ({ user, surveyId, step, stepDb }, client) => {
  const chainUuid = Step.getProcessingChainUuid(step)
  const stepUuid = Step.getUuid(step)
  const promises = []

  const propsToUpdate = Step.getPropsDiff(step)(stepDb)
  const entries = Object.entries(propsToUpdate)
  if (entries.length > 0) {
    // activity log
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
    // update props
    const fields = { [TableStep.columnSet.props]: propsToUpdate }
    promises.push(StepRepository.updateStep({ surveyId, stepUuid, fields }, client))
  }

  return Promise.all(promises)
}

const _updateCalculationIndexes = async ({ user, surveyId, step }, client) => {
  const stepDb = await StepRepository.fetchStep(
    { surveyId, stepUuid: Step.getUuid(step), includeCalculations: true },
    client
  )
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

const _insertCalculation = async ({ user, surveyId, chain, calculation }, client) => {
  const calculationDb = await CalculationRepository.insertCalculation({ surveyId, calculation }, client)
  const content = {
    ...calculationDb,
    [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
  }
  const type = ActivityLog.type.processingStepCalculationCreate
  return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
}

const _updateCalculation = async ({ user, surveyId, chain, calculation, calculationDb }, client) => {
  const nodeDefUuid = Calculation.getNodeDefUuid(calculation)
  const nodeDefUuidDb = Calculation.getNodeDefUuid(calculationDb)
  const propsDiff = Calculation.getPropsDiff(calculation)(calculationDb)

  const fields = {}
  if (nodeDefUuid !== nodeDefUuidDb) fields[TableCalculation.columnSet.nodeDefUuid] = nodeDefUuid
  if (!R.isEmpty(propsDiff)) fields[TableCalculation.columnSet.props] = propsDiff

  if (!R.isEmpty(fields)) {
    const params = { surveyId, calculationUuid: Calculation.getUuid(calculation), fields }
    const calculationUpdated = await CalculationRepository.updateCalculation(params, client)
    const content = {
      ...calculationUpdated,
      [ActivityLog.keysContent.processingChainUuid]: Chain.getUuid(chain),
    }
    const type = ActivityLog.type.processingStepCalculationUpdate
    return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
  }
  return null
}

const _insertOrUpdateCalculation = async ({ user, surveyId, chain, calculation }, client) => {
  const params = { surveyId, calculationUuid: Calculation.getUuid(calculation) }
  const calculationDb = await CalculationRepository.fetchCalculation(params, client)
  return calculationDb
    ? _updateCalculation({ user, surveyId, chain, calculation, calculationDb }, client)
    : _insertCalculation({ user, surveyId, chain, calculation }, client)
}

// ====== UPDATE - Chain

export const persistAll = async ({ user, surveyId, chain, step = null, calculation = null }, client = DB.client) =>
  client.tx(async (tx) => {
    // 1. Persist chain / step / calculation
    await _insertOrUpdateChain({ user, surveyId, chain }, tx)
    if (step) {
      await _insertOrUpdateStep({ user, surveyId, step }, tx)
      if (calculation) {
        await _insertOrUpdateCalculation({ user, surveyId, chain, calculation }, tx)
      }
      await _updateCalculationIndexes({ user, surveyId, step }, client)
    }

    // 2. Validate chain / step / calculation
    const [surveyInfo, chainDb] = await Promise.all([
      SurveyRepository.fetchSurveyById(surveyId, true, tx),
      ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain), includeStepsAndCalculations: true }, tx),
    ])
    const stepDb = step ? Chain.getStepByIdx(Step.getIndex(step))(chainDb) : null
    const lang = Survey.getDefaultLanguage(surveyInfo)

    const calculationValidation = calculation ? await ChainValidator.validateCalculation(calculation, lang) : null
    const stepValidation = stepDb ? await ChainValidator.validateStep(stepDb) : null
    const chainValidation = await ChainValidator.validateChain(chainDb, lang)

    if (!R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      // Throw error to rollback transaction
      throw new SystemError('appErrors.processingChainCannotBeSaved')
    }

    return _afterChainUpdate(surveyId, tx, false)
  })

// ====== DELETE - Chain

// Deletes a processing chain.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteChain = async ({ user, surveyId, chainUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const chains = await ChainRepository.deleteChain({ surveyId, chainUuid }, tx)
    const content = {
      [ActivityLog.keysContent.uuid]: chainUuid,
      [ActivityLog.keysContent.labels]: Chain.getLabels(chains[0]),
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, content, false, tx)

    return _afterChainUpdate(surveyId, tx)
  })

// ====== DELETE - Step

// Deletes a processing step.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteStep = async ({ user, surveyId, stepUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const step = await StepRepository.fetchStep({ surveyId, stepUuid }, tx)

    const chainUuid = Step.getProcessingChainUuid(step)
    const stepNext = await StepRepository.fetchStep({ surveyId, chainUuid, stepIndex: Step.getIndex(step) + 1 }, tx)
    if (stepNext) {
      throw new SystemError('appErrors.processingStepOnlyLastCanBeDeleted')
    }

    const content = {
      [ActivityLog.keysContent.uuid]: stepUuid,
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
      [ActivityLog.keysContent.index]: Step.getIndex(step),
    }
    await Promise.all([
      StepRepository.deleteStep({ surveyId, stepUuid }, tx),
      ChainRepository.updateChain({ surveyId, chainUuid, dateModified: true }, tx),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepDelete, content, false, tx),
    ])

    if (Step.getIndex(step) === 0) {
      // Deleted processing step was the only one, chain validation must be updated (steps are required)
      const [surveyInfo, chain] = await Promise.all([
        SurveyRepository.fetchSurveyById(surveyId, false, tx),
        ChainRepository.fetchChain({ surveyId, chainUuid }, tx),
      ])
      const chainValidation = await ChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
      const chainUpdated = Chain.assocItemValidation(chainUuid, chainValidation)(chain)
      const fields = { [TableChain.columnSet.validation]: Chain.getValidation(chainUpdated) }
      await ChainRepository.updateChain({ surveyId, chainUuid, fields }, tx)
    }

    return _afterChainUpdate(surveyId, tx)
  })

// ====== DELETE - Calculation

// Deletes a processing step calculation.
// It returns a list of deleted unused node def analysis uuids (if any)
export const deleteCalculation = async ({ user, surveyId, stepUuid, calculationUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const [step, calculation] = await Promise.all([
      StepRepository.fetchStep({ surveyId, stepUuid }, tx),
      CalculationRepository.deleteCalculation({ surveyId, calculationUuid }, tx),
    ])
    const chainUuid = Step.getProcessingChainUuid(step)

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
    await ActivityLogRepository.insert(user, surveyId, type, content, false, tx)

    // Update step validation
    const chain = await ChainRepository.fetchChain({ surveyId, chainUuid, includeStepsAndCalculations: true }, tx)
    const stepValidation = await ChainValidator.validateStep(Chain.getStepByIdx(Step.getIndex(step))(chain))
    const chainUpdated = Chain.assocItemValidation(stepUuid, stepValidation)(chain)
    // Update processing_chain validation
    const fields = { [TableChain.columnSet.validation]: Chain.getValidation(chainUpdated) }
    await ChainRepository.updateChain({ surveyId, chainUuid, fields, dateModified: true }, tx)

    return _afterChainUpdate(surveyId, tx)
  })
