import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useUpdateProps } from './useUpdateProps'
import { useDelete } from './useDelete'
import { useDismiss } from './useDismiss'
import { useSelect } from './useSelect'

export const useActions = ({
  dirty,
  setDirty,
  chain,
  setChain,

  state,
  setState,
  State,
}) => ({
  create: useCreate({
    chain,
    setChain,

    setState,
  }),
  update: useUpdate({ dirty, setDirty, chain, setChain, setState }),
  updateProps: useUpdateProps({
    dirty,
    setDirty,
    chain,
    setChain,

    state,
    setState,
    State,
  }),
  delete: useDelete({ chain, setChain, state, setState, State }),
  dismiss: useDismiss({
    setDirty,
    chain,
    setChain,
    state,
    setState,
    State,
  }),
  select: useSelect({ chain, setChain, state, setState, State }),
})
