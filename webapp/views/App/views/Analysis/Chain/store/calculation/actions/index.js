import { useDelete } from './useDelete'
import { useMove } from './useMove'
import { useUpdateProp } from './useUpdateProp'
import { useUpdateAttribute } from './useUpdateAttribute'
import { useSelect } from './useSelect'
import { useDismiss } from './useDismiss'

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
  move: useMove({ stepState, StepState }),
  dismiss: useDismiss({
    chainState,
    ChainState,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  delete: useDelete({ stepState, StepState, state, State, setState }),
  updateProp: useUpdateProp({
    chainState,
    ChainState,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  updateAttribute: useUpdateAttribute({
    chainState,
    ChainState,
    stepState,
    StepState,
    state,
    State,
    setState,
  }),
})
