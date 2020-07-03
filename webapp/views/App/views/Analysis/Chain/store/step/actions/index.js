import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useDismiss } from './useDismiss'

export const useActions = ({ chainState, ChainState, state, setState, State }) => ({
  update: useUpdate({ chainState, ChainState, setState }),
  delete: useDelete({ chainState, ChainState, state, setState, State }),
  dismiss: useDismiss({
    chainState,
    ChainState,
    state,
    setState,
    State,
  }),
})
