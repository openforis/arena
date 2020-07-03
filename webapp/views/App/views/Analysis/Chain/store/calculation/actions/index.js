import { useCreate } from './useCreate'
import { useDelete } from './useDelete'
import { useMove } from './useMove'
import { useUpdateProp } from './useUpdateProp'
import { useUpdateAttribute } from './useUpdateAttribute'
import { useSelect } from './useSelect'
import { useDismiss } from './useDismiss'

export const useActions = ({
  chain,
  setChain,
  dirty,
  setDirty,
  stepState,
  StepState,

  state,
  setState,
  State,
}) => ({
  create: useCreate({
    chain,
    setChain,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  select: useSelect({
    chain,
    setChain,
    dirty,
    setDirty,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  move: useMove({ stepState, StepState }),
  dismiss: useDismiss({
    chain,
    setChain,
    dirty,
    setDirty,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  delete: useDelete({ stepState, StepState, state, State, setState }),
  updateProp: useUpdateProp({
    chain,
    setChain,
    dirty,
    setDirty,

    stepState,
    StepState,

    state,
    State,
    setState,
  }),
  updateAttribute: useUpdateAttribute({
    chain,
    setChain,
    dirty,
    setDirty,
    stepState,
    StepState,
    state,
    State,
    setState,
  }),
})
