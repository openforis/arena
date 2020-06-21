import { useOnInit } from './useOnInit'
import { useOnUpdate } from './useOnUpdate'
import { useOnSave } from './useOnSave'
import { useOnDismiss } from './useOnDismiss'

export const useActions = ({ chain, setChain, dirty, setDirty }) => ({
  onInit: useOnInit({ chain, setChain }),
  onUpdate: useOnUpdate({ chain, setChain, dirty, setDirty }),
  onSave: useOnSave({ chain, setChain }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
})
