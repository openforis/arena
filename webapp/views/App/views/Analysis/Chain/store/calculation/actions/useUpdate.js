import { useSurveyInfo } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'

export const useUpdate = ({ chain, setChain, step, setStep, setDirty, state, State, setState }) => {
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  return ({ calculationUpdated }) => {
    const stepUpdated = Step.assocCalculation(calculationUpdated)(step)
    setStep(stepUpdated)

    const calculationValidation = ChainValidator.validateCalculation(calculationUpdated, surveyDefaultLang)
    const chainUpdated = Chain.assocItemValidation(
      Calculation.getUuid(calculationUpdated),
      calculationValidation
    )(chain)

    setChain(chainUpdated)

    setState(State.assoc({ calculation: calculationUpdated, calculationDirty: true })(state))
    setDirty(true)
  }
}
