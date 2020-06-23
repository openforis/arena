import { useOnInit } from './useOnInit'
import { useOnDismiss } from './useOnDismiss'

export const useActions = ({ chain, setChain, dirty, setDirty, step, setStep, calculation, setCalculation }) => ({
  onInit: useOnInit({ chain, setChain, step, setStep, calculation, setCalculation }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
})
