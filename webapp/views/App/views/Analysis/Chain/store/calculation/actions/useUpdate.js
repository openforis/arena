import { useSurveyInfo } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'

export const useUpdate = ({ chainState, ChainState, stepState, StepState, setState }) => {
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  return ({ calculationUpdated }) => {
    const step = StepState.getStep(stepState)
    const stepUpdated = Step.assocCalculation(calculationUpdated)(step)

    StepState.setState({
      step: stepUpdated,
    })

    const calculationValidation = ChainValidator.validateCalculation(calculationUpdated, surveyDefaultLang)
    const chainUpdated = Chain.assocItemValidation(
      Calculation.getUuid(calculationUpdated),
      calculationValidation
    )(ChainState.getChain(chainState))

    ChainState.setState({
      chain: chainUpdated,
      dirty: true,
    })

    setState({ calculation: calculationUpdated, calculationDirty: true })
  }
}
