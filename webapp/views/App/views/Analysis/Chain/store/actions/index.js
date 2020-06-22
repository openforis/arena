import { useOnInit } from './useOnInit'
import { useOnUpdate } from './useOnUpdate'
import { useOnDismiss } from './useOnDismiss'

export const useActions = ({ chain, setChain, dirty, setDirty }) => ({
  onInit: useOnInit({ chain, setChain }),
  onUpdate: useOnUpdate({ chain, setChain, dirty, setDirty }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
})
