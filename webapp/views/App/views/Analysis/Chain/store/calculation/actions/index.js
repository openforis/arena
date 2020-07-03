import { useCreate } from './useCreate'
import { useDelete } from './useDelete'
import { useMove } from './useMove'
import { useUpdateProp } from './useUpdateProp'
import { useUpdateAttribute } from './useUpdateAttribute'
import { useSelect } from './useSelect'
import { useDismiss } from './useDismiss'

export const useActions = ({ chain, setChain, dirty, setDirty, step, setStep, state, setState, State }) => ({
  create: useCreate({
    chain,
    setChain,
    step,
    setStep,
    state,
    State,
    setState,
  }),
  select: useSelect({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    state,
    State,
    setState,
  }),
  move: useMove({ step, setStep }),
  dismiss: useDismiss({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    state,
    State,
    setState,
  }),
  delete: useDelete({ step, setStep, ...state, state, State, setState }),
  updateProp: useUpdateProp({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    state,
    State,
    setState,
  }),
  updateAttribute: useUpdateAttribute({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    state,
    State,
    setState,
  }),
})
