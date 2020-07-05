import { useCallback } from 'react'
import { useSurveyInfo } from '@webapp/store/survey'

import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'

import { State } from '../../state'

export const useUpdate = ({ setState }) => {
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  return useCallback(({ calculationUpdated, state }) => {
    const stepEdit = State.getStepEdit(state)
    const stepUpdated = Step.assocCalculation(calculationUpdated)(stepEdit)
    const calculationValidation = ChainValidator.validateCalculation(calculationUpdated, surveyDefaultLang)
    const chainUpdated = Chain.assocItemValidation(
      Calculation.getUuid(calculationUpdated),
      calculationValidation
    )(State.getChainEdit(state))

    setState(
      A.pipe(
        State.assocChainEdit(chainUpdated),
        State.assocStepEdit(stepUpdated),
        State.assocCalculationEdit(calculationUpdated)
      )(state)
    )
  }, [])
}
