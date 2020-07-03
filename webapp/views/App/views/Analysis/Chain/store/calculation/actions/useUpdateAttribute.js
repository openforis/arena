import * as Calculation from '@common/analysis/processingStepCalculation'

import * as NodeDef from '@core/survey/nodeDef'

import { useUpdate } from './useUpdate'

export const useUpdateAttribute = ({ chainState, ChainState, stepState, StepState, state, setState, State }) => {
  const update = useUpdate({
    chainState,
    ChainState,
    stepState,
    StepState,

    state,
    setState,
    State,
  })
  const calculation = State.getCalculation(state)

  return ({ attrDef }) => {
    const calculationUpdated = Calculation.assocNodeDefUuid(NodeDef.getUuid(attrDef))(calculation)
    update({ calculationUpdated })
  }
}
