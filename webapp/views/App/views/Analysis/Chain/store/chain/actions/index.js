import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'

export const useActions = ({ chain, setChain, dirty, setDirty }) => ({
  update: useUpdate({ chain, setChain, dirty, setDirty }),
  delete: useDelete({ chain, setChain, dirty, setDirty }),
})
