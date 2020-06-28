import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useUpdateCycles } from './useUpdateCycles'

export const useActions = ({ chain, setChain, dirty, setDirty }) => ({
  update: useUpdate({ chain, setChain, dirty, setDirty }),
  updateCycles: useUpdateCycles({ chain, setChain, dirty, setDirty }),
  delete: useDelete({ chain, setChain, dirty, setDirty }),
})
