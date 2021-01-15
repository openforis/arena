import { useCallback } from 'react'
import { useSurveyInfo } from '@webapp/store/survey'

import * as A from '@core/arena'

import * as ChainController from '@common/analysis/chainController'
import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'

import { State } from '../../state'

export const useUpdate = ({ setState }) => {
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  return useCallback(({ calculationUpdated, state }) => {
    const chain = State.getChainEdit(state)
    const step = State.getStepEdit(state)

    const { step: stepUpdated } = ChainController.assocCalculation({ chain, step, calculation: calculationUpdated })
    const calculationValidation = ChainValidator.validateCalculation(calculationUpdated, surveyDefaultLang)
    const chainUpdated = Chain.assocItemValidation(
      Calculation.getUuid(calculationUpdated),
      calculationValidation
    )(chain)

    const stateUpdated = A.pipe(
      State.assocChainEdit(chainUpdated),
      State.assocStepEdit(stepUpdated),
      State.assocCalculationEdit(calculationUpdated)
    )(state)

    setState(stateUpdated)
    return stateUpdated
  }, [])
}
