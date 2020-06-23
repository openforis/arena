import { useUpdate } from './useUpdate'

export const chainActions = ({ chain, setChain, dirty, setDirty }) => ({
  update: useUpdate({ chain, setChain, dirty, setDirty }),
})
