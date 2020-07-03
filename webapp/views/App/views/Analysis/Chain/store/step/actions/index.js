import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'

export const useActions = ({ chainState, ChainState, state, setState, State }) => ({
  update: useUpdate({ chainState, ChainState, setState }),
  delete: useDelete({ chainState, ChainState, state, setState, State }),
})
