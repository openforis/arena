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

  stepState,
  StepState,

  calculationState,
  CalculationState,
}) => ({
  init: useInit({ chain, setChain, stepState, StepState, calculationState, CalculationState }),
  dismiss: useDismiss({ chain, setChain, dirty, setDirty }),
  save: useSave({
    chain,
    setChain,
    stepState,
    StepState,
    calculationState,
    CalculationState,
  }),
  canSelectNodeDef: useCanSelectNodeDef({ chain }),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chain,
  }),
  addEntityVirtual: useAddEntityVirtual({ chain, stepState, StepState, calculationState, CalculationState }),
  addNodeDefAnalysis: useAddNodeDefAnalysis({ chain, stepState, StepState, calculationState, CalculationState }),
  openRStudio: useOpenRStudio({ chain }),
})
