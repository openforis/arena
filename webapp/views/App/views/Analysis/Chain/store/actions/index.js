import { useOnInit } from './useOnInit'
import { useOnDismiss } from './useOnDismiss'
import { useCanSelectNodeDef } from './useCanSelectNodeDef'
import { useGetAttributeUuidsOtherChains } from './useGetAttributeUuidsOtherChains'
import { useAddEntityVirtual } from './useAddEntityVirtual'
import { useAddNodeDefAnalysis } from './useAddNodeDefAnalysis'
import { useOnSave } from './useOnSave'
import { useOpenRStudio } from './useOpenRStudio'

export const useActions = (dependencies) => ({
  onInit: useOnInit(dependencies),
  onDismiss: useOnDismiss(dependencies),
  onSave: useOnSave(dependencies),
  canSelectNodeDef: useCanSelectNodeDef(dependencies),
  getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains(dependencies),
  addEntityVirtual: useAddEntityVirtual(),
  addNodeDefAnalysis: useAddNodeDefAnalysis(dependencies),
  openRStudio: useOpenRStudio(dependencies),
})
