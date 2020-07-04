import { useDelete } from './useDelete'
import { useSelect } from './useSelect'

export const useActions = ({
  chainState,
  ChainState,

  stepState,
  StepState,

  state,
  setState,
  State,
}) => ({
  select: useSelect({
    chainState,
    ChainState,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  delete: useDelete({ stepState, StepState, state, State, setState }),
})
