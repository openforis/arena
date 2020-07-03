import { useInit } from './chain/useInit'
import { useOpenRStudio } from './chain/useOpenRStudio'
import { useUpdateChain } from './chain/useUpdateChain'
import { useUpdateCycles } from './chain/useUpdateCycles'
import { useDismiss } from './useDismiss'

import { useCreate as useCreateStep } from './step/useCreate'

// import { useCanSelectNodeDef } from './useCanSelectNodeDef'
// import { useGetAttributeUuidsOtherChains } from './useGetAttributeUuidsOtherChains'
// import { useAddEntityVirtual } from './useAddEntityVirtual'
// import { useAddNodeDefAnalysis } from './useAddNodeDefAnalysis'
// import { useSave } from './useSave'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  openRStudio: useOpenRStudio(),
  updateChain: useUpdateChain({ setState }),
  updateCycles: useUpdateCycles({ setState }),
  dismiss: useDismiss(),

  createStep: useCreateStep({ setState }),
  // save: useSave({
  //   setState,
  // }),
  // canSelectNodeDef: useCanSelectNodeDef({ chainState, ChainState }),
  // getAttributeUuidsOtherChains: useGetAttributeUuidsOtherChains({
  //   setState,
  // }),
  // addEntityVirtual: useAddEntityVirtual({
  //   setState,
  // }),
  // addNodeDefAnalysis: useAddNodeDefAnalysis({
  //   setState,
  // }),
})
