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
  chainState,
  ChainState,

  stepState,
  StepState,

  calculationState,
  CalculationState,
}) => ({
  init: useInit({ chainState, ChainState, stepState, StepState, calculationState, CalculationState }),
  dismiss: useDismiss({ chainState, ChainState }),
  save: useSave({
    chainState,
    ChainState,
    stepState,
    StepState,
    calculationState,
    CalculationState,
  }),
  canSelectNodeDef: useCanSelectNodeDef({ chainState, ChainState }),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chainState,
    ChainState,
  }),
  addEntityVirtual: useAddEntityVirtual({
    chainState,
    ChainState,
    stepState,
    StepState,
    calculationState,
    CalculationState,
  }),
  addNodeDefAnalysis: useAddNodeDefAnalysis({
    chainState,
    ChainState,
    stepState,
    StepState,
    calculationState,
    CalculationState,
  }),
  openRStudio: useOpenRStudio({ chainState, ChainState }),
})
