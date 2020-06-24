import { useUpdate } from './useUpdate'

export const useActions = ({ chain, setChain, dirty, setDirty }) => ({
  update: useUpdate({ chain, setChain, dirty, setDirty }),
})
