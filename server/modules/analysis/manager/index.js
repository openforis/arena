import * as R from 'ramda'
import SystemError from '../../../../core/systemError'
import * as DB from '../../../db'

import * as Validation from '../../../../core/validation/validation'
import * as Survey from '../../../../core/survey/survey'
import * as Chain from '../../../../common/analysis/processingChain'
import * as Step from '../../../../common/analysis/processingStep'
import * as ChainValidator from '../../../../common/analysis/processingChainValidator'

import { markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../../survey/repository/surveyRepository'
import * as ChainRepository from '../repository/chain'

import { persistChain } from './chain'
import { persistStep, updateCalculationIndexes, insertStepsInBatch } from './step'
import { persistCalculation, insertCalculationsInBatch } from './calculation'

// ====== Chain
export {
  countChains,
  fetchChains,
  fetchChain,
  updateChain,
  updateChainStatusExec,
  removeChainCycles,
  deleteChain,
  deleteChainWithoutCycle,
} from './chain'

// ====== Step
export { fetchSteps, fetchStep, fetchVariablesPrevSteps } from './step'

// ====== Calculation
export { fetchCalculationAttributeUuids, updateCalculation } from './calculation'

// ====== Persist all

/* eslint-disable */
/**
 * @deprecated
 */
export const persistAll = async ({ user, surveyId, chain, step = null, calculation = null }, client = DB.client) =>
  client.tx(async (tx) => {
    // 1. Persist chain / step / calculation
    await Promise.all([persistChain({ user, surveyId, chain }, tx), markSurveyDraft(surveyId, tx)])
    if (step) {
      await persistStep({ user, surveyId, step }, tx)
      if (calculation) {
        await persistCalculation({ user, surveyId, chain, calculation }, tx)
      }
      await updateCalculationIndexes({ user, surveyId, step }, client)
    }

    // 2. Reload chain including steps and calculations
    const [surveyInfo, chainDb] = await Promise.all([
      SurveyRepository.fetchSurveyById({ surveyId, draft: true }, tx),
      ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain), includeStepsAndCalculations: true }, tx),
    ])
    const stepDb = step ? Chain.getStepByIdx(Step.getIndex(step))(chainDb) : null

    // 3. Validate chain / step / calculation
    const lang = Survey.getDefaultLanguage(surveyInfo)
    const calculationValidation = calculation ? await ChainValidator.validateCalculation(calculation, lang) : null
    const stepValidation = stepDb ? await ChainValidator.validateStep(stepDb) : null
    const chainValidation = await ChainValidator.validateChain(chainDb, lang)

    if (!R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      // Throw error to rollback transaction
      throw new SystemError('appErrors.processingChainCannotBeSaved')
    }
  })

export const importChain = async ({ user, surveyId, chain }, client = DB.client) =>
  client.tx(async (tx) => {
    await persistChain({ user, surveyId, chain }, tx)
    const steps = Chain.getProcessingSteps(chain)

    if (steps.length <= 0) return
    await insertStepsInBatch({ user, surveyId, steps }, tx)
    const calculations = steps.flatMap(Step.getCalculations)

    if (calculations.length <= 0) return
    await insertCalculationsInBatch({ user, surveyId, calculations }, tx)
  })
