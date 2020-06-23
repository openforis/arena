import { useOnInit } from './useOnInit'
import { useOnUpdate } from './useOnUpdate'
import { useOnDismiss } from './useOnDismiss'
import { useOnNewStep } from './useOnNewStep'
import { useOnSelectStep } from './useOnSelectStep'
import { useOnUpdateStep } from './useOnUpdateStep'
import { useOnDeleteStep } from './useOnDeleteStep'
import { useOnNewCalculation } from './useOnNewCalculation'
import { useOnMoveCalculation } from './useOnMoveCalculation'
import { useOnDeleteCalculation } from './useOnDeleteCalculation'

export const useActions = ({ chain, setChain, dirty, setDirty, step, setStep, calculation, setCalculation }) => ({
  onInit: useOnInit({ chain, setChain, setStep }),
  onUpdate: useOnUpdate({ chain, setChain, dirty, setDirty }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
  onNewStep: useOnNewStep({ chain, setChain, step, setStep }),
  onSelectStep: useOnSelectStep({ chain, setChain, step, setStep }),
  onUpdateStep: useOnUpdateStep({ chain, setChain, step, setStep, dirty, setDirty }),
  onDeleteStep: useOnDeleteStep({ chain, setChain, step, setStep }),
  onNewCalculation: useOnNewCalculation({ chain, setChain, step, setStep, setCalculation }),
  onMoveCalculation: useOnMoveCalculation({ step, setStep }),
  onDeleteCalculation: useOnDeleteCalculation({ step, setStep, calculation, setCalculation }),
})
