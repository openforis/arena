import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useReset = ({
  chain,
  setChain,
  step,
  setStep,
  setDirty,
  calculation,
  calculationOriginal,
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
    calculationOriginal,
    setCalculation,
    setCalculationDirty,
  })

  const resetCalculation = async () => {
    setCalculation(null)
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)

    setStep(stepWithOutCalculation)
    setCalculationDirty(null)
  }

  return () => {
    if (!A.isEmpty(calculationOriginal)) {
      update({ calculationUpdated: calculationOriginal })
    } else {
      resetCalculation()
    }
  }
}
