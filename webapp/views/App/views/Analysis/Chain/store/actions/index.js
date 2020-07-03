import { useInit } from './useInit'
import { useDismiss } from './useDismiss'
import { useCanSelectNodeDef } from './useCanSelectNodeDef'
import { useGetAttributeUuidsOtherChains } from './useGetAttributeUuidsOtherChains'
import { useAddEntityVirtual } from './useAddEntityVirtual'
import { useAddNodeDefAnalysis } from './useAddNodeDefAnalysis'
import { useSave } from './useSave'
import { useOpenRStudio } from './useOpenRStudio'

export const useActions = ({
  attributesUuidsOtherChains,
  setAtrributesUuidsOtherChains,
  chain,
  setChain,
  dirty,
  setDirty,
  step,
  setStep,
  stepDirty,
  setStepDirty,
  setStepOriginal,
  calculationState,
  CalculationState,
}) => ({
  init: useInit({ chain, setChain, step, setStep, setStepDirty, calculationState, CalculationState }),
  dismiss: useDismiss({ chain, setChain, dirty, setDirty }),
  save: useSave({
    chain,
    setChain,
    step,
    stepDirty,
    setStepDirty,
    setStepOriginal,
    calculationState,
    CalculationState,
  }),
  canSelectNodeDef: useCanSelectNodeDef({ chain }),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chain,
  }),
  addEntityVirtual: useAddEntityVirtual({ chain, step, stepDirty, calculationState, CalculationState }),
  addNodeDefAnalysis: useAddNodeDefAnalysis({ chain, step, stepDirty, calculationState, CalculationState }),
  openRStudio: useOpenRStudio({ chain }),
})
