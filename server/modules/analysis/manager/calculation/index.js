import * as R from 'ramda'
import * as DB from '../../../../db'

import * as Chain from '../../../../../common/analysis/processingChain'
import * as Step from '../../../../../common/analysis/processingStep'
import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import * as ChainValidator from '../../../../../common/analysis/processingChainValidator'
import * as ChainController from '../../../../../common/analysis/chainController'
import { TableCalculation, TableChain } from '../../../../../common/model/db'
import * as ActivityLog from '../../../../../common/activityLog/activityLog'

import { markSurveyDraft } from '../../../survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '../../../activityLog/repository/activityLogRepository'
import * as ChainRepository from '../../repository/chain'
import * as StepRepository from '../../repository/step'
import * as CalculationRepository from '../../repository/calculation'

// ====== CREATE
const _insertCalculation = async ({ user, surveyId, chainUuid, calculation }, client) => {
  const calculationDb = await CalculationRepository.insertCalculation({ surveyId, calculation }, client)
  const content = {
    ...calculationDb,
    [ActivityLog.keysContent.processingChainUuid]: chainUuid,
  }
  const type = ActivityLog.type.processingStepCalculationCreate
  return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
}

// ====== READ
export const { fetchCalculationAttributeUuids } = CalculationRepository

// ====== UPDATE
export const { updateCalculation } = CalculationRepository

const _updateCalculation = async ({ user, surveyId, chainUuid, calculation, calculationDb }, client) => {
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
      [ActivityLog.keysContent.processingChainUuid]: chainUuid,
    }
    const type = ActivityLog.type.processingStepCalculationUpdate
    return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
  }
  return null
}

// ====== PERSIST
export const persistCalculation = async ({ user, surveyId, chain, calculation }, client) => {
  const params = { surveyId, calculationUuid: Calculation.getUuid(calculation) }
  const chainUuid = Chain.getUuid(chain)
  const calculationDb = await CalculationRepository.fetchCalculation(params, client)
  return calculationDb
    ? _updateCalculation({ user, surveyId, chainUuid, calculation, calculationDb }, client)
    : _insertCalculation({ user, surveyId, chainUuid, calculation }, client)
}

// ====== DELETE
export const deleteCalculation = async ({ user, surveyId, stepUuid, calculationUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const [step, calculation] = await Promise.all([
      StepRepository.fetchStep({ surveyId, stepUuid }, tx),
      CalculationRepository.deleteCalculation({ surveyId, calculationUuid }, tx),
      markSurveyDraft(surveyId, tx),
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

    // Reload chain including steps and calculations
    const chain = await ChainRepository.fetchChain({ surveyId, chainUuid, includeStepsAndCalculations: true }, tx)
    const stepDb = Chain.getStepByIdx(Step.getIndex(step))(chain)
    // Update next step variables prev step (if updated)
    const { stepNextUpdated } = ChainController.deleteCalculation({ chain, step: stepDb, calculation })
    if (stepNextUpdated) {
      await StepRepository.updateStep(
        {
          surveyId,
          stepUuid: Step.getUuid(stepNextUpdated),
          fields: {
            [Step.keys.props]: {
              [Step.keysProps.variablesPreviousStep]: Step.getVariablesPreviousStep(stepNextUpdated),
            },
          },
        },
        tx
      )
    }
    // Update step validation
    const stepValidation = await ChainValidator.validateStep(stepDb)
    const chainUpdated = Chain.assocItemValidation(stepUuid, stepValidation)(chain)
    // Update processing_chain validation
    const fields = { [TableChain.columnSet.validation]: Chain.getValidation(chainUpdated) }
    return ChainRepository.updateChain({ surveyId, chainUuid, fields, dateModified: true }, tx)
  })
