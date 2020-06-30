import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'

import { AnalysisActions } from '@webapp/service/storage'

import { useUpdate } from './useUpdate'

export const useReset = ({
  chain,
  setChain,
  step,
  setStep,
  setDirty,
  calculation,
  originalCalculation,
  setCalculation,
  setCalculationDirty,
}) => {
  const update = useUpdate({
    chain,
    setChain,
    step,
    setStep,
    setDirty,
    calculation,
    originalCalculation,
    setCalculation,
    setCalculationDirty,
  })

  const resetCalculation = async () => {
    AnalysisActions.resetCalculation()
    setCalculation({})
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)

    AnalysisActions.persistStep({ step: stepWithOutCalculation, stepDirty: true })
    setStep(stepWithOutCalculation)
    setCalculationDirty(false)
  }

  return () => {
    if (!A.isEmpty(originalCalculation)) {
      update({ calculationUpdated: originalCalculation })
    } else {
      resetCalculation()
    }
  }
}
