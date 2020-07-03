import { useUpdate } from './useUpdate'
import { useUpdateProps } from './useUpdateProps'
import { useDelete } from './useDelete'
import { useDismiss } from './useDismiss'
import { useSelect } from './useSelect'

export const useActions = ({ chainState, ChainState, state, setState, State }) => ({
  update: useUpdate({ chainState, ChainState, setState }),
  updateProps: useUpdateProps({
    chainState,
    ChainState,

    state,
    setState,
    State,
  }),
  delete: useDelete({ chainState, ChainState, state, setState, State }),
  dismiss: useDismiss({
    chainState,
    ChainState,
    state,
    setState,
    State,
  }),
  select: useSelect({ chainState, ChainState, state, setState, State }),
})
