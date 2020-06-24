import { useSurveyInfo } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as Survey from '@core/survey/survey'

import { AnalysisActions } from '@webapp/service/storage'

const resetNodeDefIfPropIsType = ({ prop }) => (calculation) =>
  prop === Calculation.keysProps.type ? Calculation.assocNodeDefUuid(null)(calculation) : calculation

const resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical = ({ prop, value }) => (calculation) =>
  prop === Calculation.keysProps.type && value === Calculation.type.categorical
    ? Calculation.assocProp(Calculation.keysProps.aggregateFn, null)(calculation)
    : calculation

export const useUpdateProp = ({ chain, setChain, step, setStep, setDirty, calculation, setCalculation }) => {
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  return ({ prop, value }) => {
    let calculationUpdated = Calculation.assocProp(prop, value)(calculation)
    calculationUpdated = resetNodeDefIfPropIsType({ prop })(calculationUpdated)
    calculationUpdated = resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical({
      prop,
      value,
    })(calculationUpdated)

    const stepUpdated = Step.assocCalculation(calculationUpdated)(step)
    setStep(stepUpdated)
    AnalysisActions.persistStep({ step: stepUpdated })

    setCalculation(calculationUpdated)
    AnalysisActions.persistCalculation({ calculation: calculationUpdated })

    const calculationValidation = ChainValidator.validateCalculation(calculationUpdated, surveyDefaultLang)
    const chainUpdated = Chain.assocItemValidation(
      Calculation.getUuid(calculationUpdated),
      calculationValidation
    )(chain)

    setChain(chainUpdated)
    AnalysisActions.persistChain({ chain: chainUpdated })

    setDirty(true)
  }
}
