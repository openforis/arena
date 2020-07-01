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
  calculationOriginal,
  setCalculationOriginal,
}) => ({
  create: useCreate({
    chain,
    setChain,
    step,
    setStep,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
    setCalculationOriginal,
  }),
  select: useSelect({
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
    calculationOriginal,
    setCalculationOriginal,
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
    calculationOriginal,
    setCalculation,
    calculationDirty,
    setCalculationDirty,
  }),
  delete: useDelete({ step, setStep, calculation, setCalculation, setCalculationDirty }),
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
