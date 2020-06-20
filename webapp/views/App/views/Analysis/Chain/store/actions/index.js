import { useOnInit } from './useOnInit'
import { useOnUpdate } from './useOnUpdate'
import { useOnSave } from './useOnSave'

export const useActions = ({ chain, setChain }) => ({
  onInit: useOnInit({ chain, setChain }),
  onUpdate: useOnUpdate({ chain, setChain }),
  onSave: useOnSave({ chain, setChain }),
})
