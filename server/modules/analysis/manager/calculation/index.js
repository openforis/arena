import * as R from 'ramda'
import * as DB from '../../../../db'

import * as Chain from '../../../../../common/analysis/processingChain'
import * as Step from '../../../../../common/analysis/processingStep'
import * as Calculation from '../../../../../common/analysis/processingStepCalculation'
import * as ChainValidator from '../../../../../common/analysis/processingChainValidator'
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
export const { updateCalculation, insertCalculationsInBatch } = CalculationRepository

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
