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
  calculation,
  setCalculation,
  calculationDirty,
  setCalculationDirty,
  setCalculationOriginal,
}) => ({
  init: useInit({ chain, setChain, step, setStep, setStepDirty, calculation, setCalculation, setCalculationDirty }),
  dismiss: useDismiss({ chain, setChain, dirty, setDirty }),
  save: useSave({
    chain,
    setChain,
    step,
    calculation,
    stepDirty,
    setStepDirty,
    setStepOriginal,
    calculationDirty,
    setCalculationDirty,
    setCalculationOriginal,
  }),
  canSelectNodeDef: useCanSelectNodeDef({ chain }),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chain,
  }),
  addEntityVirtual: useAddEntityVirtual({ chain, step, calculation }),
  addNodeDefAnalysis: useAddNodeDefAnalysis({ chain, step, calculation }),
  openRStudio: useOpenRStudio({ chain }),
})
