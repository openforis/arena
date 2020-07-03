import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useReset = ({
  chain,
  setChain,
  step,
  setStep,
  setDirty,

  state,
  setState,
  State,
}) => {
  const update = useUpdate({
    chain,
    setChain,
    step,
    setStep,
    setDirty,
    state,
    setState,
    State,
  })
  const { calculation, calculationOriginal } = State.get(state)

  const resetCalculation = () => {
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)
    setStep(stepWithOutCalculation)

    setState(
      State.assoc({
        calculation: null,
        calculationDirty: null,
      })
    )
  }

  return () => {
    if (!A.isEmpty(calculationOriginal)) {
      update({ calculationUpdated: calculationOriginal })
    } else {
      resetCalculation()
    }
  }
}
