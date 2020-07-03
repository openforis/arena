import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useReset = ({
  chainState,
  ChainState,

  stepState,
  StepState,

  state,
  setState,
  State,
}) => {
  const update = useUpdate({
    chainState,
    ChainState,

    stepState,
    StepState,

    state,
    setState,
    State,
  })
  const { calculation, calculationOriginal } = State.get(state)

  const resetCalculation = () => {
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(StepState.getStep(stepState))

    StepState.setState({
      step: stepWithOutCalculation,
    })

    setState({
      calculation: null,
      calculationDirty: null,
    })
  }

  return () => {
    if (!A.isEmpty(calculationOriginal)) {
      update({ calculationUpdated: calculationOriginal })
    } else {
      resetCalculation()
    }
  }
}
