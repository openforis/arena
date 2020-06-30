import * as A from '@core/arena'

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

  return () => {
    if (!A.isEmpty(originalCalculation)) {
      update({ calculationUpdated: originalCalculation })
    }
  }
}
