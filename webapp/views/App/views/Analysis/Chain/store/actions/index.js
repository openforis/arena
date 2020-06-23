import { useOnInit } from './useOnInit'
import { useOnDismiss } from './useOnDismiss'

import { chainActions } from './chain'
import { stepActions } from './step'
import { calculationActions } from './calculation'

export const useActions = ({ chain, setChain, dirty, setDirty, step, setStep, calculation, setCalculation }) => ({
  onInit: useOnInit({ chain, setChain, setStep }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),

  chain: {
    ...chainActions({ chain, setChain, dirty, setDirty }),
  },
  step: {
    ...stepActions({ chain, setChain, dirty, setDirty, step, setStep }),
  },
  calculation: {
    ...calculationActions({ chain, setChain, dirty, setDirty, step, setStep, calculation, setCalculation }),
  },
})
