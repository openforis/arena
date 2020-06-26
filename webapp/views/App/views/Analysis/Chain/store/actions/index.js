import { useOnInit } from './useOnInit'
import { useOnDismiss } from './useOnDismiss'
import { useCanSelectNodeDef } from './useCanSelectNodeDef'
import { useGetAttributeUuidsOtherChains } from './useGetAttributeUuidsOtherChains'
import { useAddEntityVirtual } from './useAddEntityVirtual'
import { useAddNodeDefAnalysis } from './useAddNodeDefAnalysis'
import { useOnSave } from './useOnSave'
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
  calculation,
  setCalculation,
}) => ({
  onInit: useOnInit({ chain, setChain, step, setStep, calculation, setCalculation }),
  onDismiss: useOnDismiss({ chain, setChain, dirty, setDirty }),
  onSave: useOnSave({ chain, setChain, step, calculation }),
  canSelectNodeDef: useCanSelectNodeDef({ chain }),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
    attributesUuidsOtherChains,
    setAtrributesUuidsOtherChains,
    chain,
  }),
  addEntityVirtual: useAddEntityVirtual(),
  addNodeDefAnalysis: useAddNodeDefAnalysis({ step, calculation }),
  openRStudio: useOpenRStudio({ chain }),
})
