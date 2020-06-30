import { useCreate } from './useCreate'
import { useDelete } from './useDelete'
import { useMove } from './useMove'
import { useUpdateProp } from './useUpdateProp'
import { useUpdateAttribute } from './useUpdateAttribute'
import { useSelect } from './useSelect'
import { useDismiss } from './useDismiss'

export const useActions = ({
  chain,
  setChain,
  dirty,
  setDirty,
  step,
  setStep,
  calculation,
  setCalculation,
  calculationDirty,
  setCalculationDirty,
  originalCalculation,
  setOriginalCalculation,
}) => ({
  create: useCreate({ chain, setChain, step, setStep, setCalculation, calculationDirty, setCalculationDirty }),
  select: useSelect({
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    originalCalculation,
    setOriginalCalculation,
  }),
  move: useMove({ step, setStep }),
  dismiss: useDismiss({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    calculation,
    originalCalculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
  }),
  delete: useDelete({ step, setStep, calculation, setCalculation }),
  updateProp: useUpdateProp({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
  }),
  updateAttribute: useUpdateAttribute({
    chain,
    setChain,
    dirty,
    setDirty,
    step,
    setStep,
    calculation,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
  }),
})
