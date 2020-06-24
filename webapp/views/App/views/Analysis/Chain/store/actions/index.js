import { useOnInit } from './useOnInit'
import { useOnDismiss } from './useOnDismiss'
import { useCanSelectNodeDef } from './useCanSelectNodeDef'

export const useActions = ({ chain, setChain, dirty, setDirty, step, setStep, calculation, setCalculation }) => ({
  onInit: useOnInit({ chain, setChain, step, setStep, calculation, setCalculation }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
  canSelectNodeDef: useCanSelectNodeDef({ chain }),
})
