import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useUpdateCycles } from './useUpdateCycles'

export const useActions = ({ state, setState, State }) => ({
  update: useUpdate({ state, setState, State }),
  updateCycles: useUpdateCycles({ state, setState, State }),
  delete: useDelete({ state, setState, State }),
})
