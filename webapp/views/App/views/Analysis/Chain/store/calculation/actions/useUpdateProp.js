import * as Calculation from '@common/analysis/processingStepCalculation'

import { useUpdate } from './useUpdate'

const resetNodeDefIfPropIsType = ({ prop }) => (calculation) =>
  prop === Calculation.keysProps.type ? Calculation.assocNodeDefUuid(null)(calculation) : calculation

const resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical = ({ prop, value }) => (calculation) =>
  prop === Calculation.keysProps.type && value === Calculation.type.categorical
    ? Calculation.assocProp(Calculation.keysProps.aggregateFn, null)(calculation)
    : calculation

export const useUpdateProp = ({ chain, setChain, stepState, StepState, setDirty, state, setState, State }) => {
  const update = useUpdate({
    chain,
    setChain,
    setDirty,

    stepState,
    StepState,

    state,
    setState,
    State,
  })

  const { calculation } = State.get(state)
  return ({ prop, value }) => {
    let calculationUpdated = Calculation.assocProp(prop, value)(calculation)
    calculationUpdated = resetNodeDefIfPropIsType({ prop })(calculationUpdated)
    calculationUpdated = resetAggregateFunctionIfPropIsTypeAndTypeIsCategorical({
      prop,
      value,
    })(calculationUpdated)

    update({ calculationUpdated })
  }
}
