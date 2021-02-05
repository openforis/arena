import * as R from 'ramda'
import * as DB from '../../../../db'
import SystemError from '../../../../../core/systemError'

import * as Survey from '../../../../../core/survey/survey'
import * as Chain from '../../../../../common/analysis/processingChain'
import * as Step from '../../../../../common/analysis/processingStep'
import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import * as ChainValidator from '../../../../../common/analysis/processingChainValidator'
import { TableChain, TableStep } from '../../../../../common/model/db'
import * as ActivityLog from '../../../../../common/activityLog/activityLog'

import { markSurveyDraft } from '../../../survey/repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../../../survey/repository/surveyRepository'
import * as ActivityLogRepository from '../../../activityLog/repository/activityLogRepository'
import * as ChainRepository from '../../repository/chain'
import * as StepRepository from '../../repository/step'
import * as CalculationRepository from '../../repository/calculation'

// ====== CREATE
const _insertStep = async ({ user, surveyId, step }, client) => {
  const stepDb = await StepRepository.insertStep({ surveyId, step }, client)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingStepCreate, stepDb, false, client)
}

// ====== READ
export const { fetchSteps, fetchStep, fetchVariablesPrevSteps, insertStepsInBatch } = StepRepository

// ====== UPDATE
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

export const updateCalculationIndexes = async ({ user, surveyId, step }, client) => {
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

// ====== PERSIST
export const persistStep = async ({ user, surveyId, step }, client) => {
  const stepDb = await StepRepository.fetchStep(
    { surveyId, stepUuid: Step.getUuid(step), includeCalculations: true },
    client
  )
  return stepDb ? _updateStep({ user, surveyId, step, stepDb }, client) : _insertStep({ user, surveyId, step }, client)
}

// ====== DELETE
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
      markSurveyDraft(surveyId, tx),
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
  })
