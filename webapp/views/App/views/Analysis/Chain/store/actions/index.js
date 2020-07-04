import { useInit } from './chain/useInit'
import { useOpenRStudio } from './chain/useOpenRStudio'
import { useUpdateChain } from './chain/useUpdateChain'
import { useUpdateCycles } from './chain/useUpdateCycles'
import { useDismiss } from './useDismiss'
import { useCanSelectNodeDef } from './useCanSelectNodeDef'

import { useCreate as useCreateStep } from './step/useCreate'
import { useSelect as useSelectStep } from './step/useSelect'
import { useUpdateProps as useUpdatePropsStep } from './step/useUpdateProps'
import { useDismiss as useDismissStep } from './step/useDismiss'
import { useDelete as useDeleteStep } from './step/useDelete'

import { useMoveCalculation } from './useMoveCalculation'

import { useCreate as useCreateCalculation } from './calculation/useCreate'
import { useSelect as useSelectCalculation } from './calculation/useSelect'
import { useUpdateProp as useUpdatePropCalculation } from './calculation/useUpdateProp'
import { useUpdateAttribute as useUpdateAttributeCalculation } from './calculation/useUpdateAttribute'

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
  selectStep: useSelectStep({ setState }),
  updatePropsStep: useUpdatePropsStep({ setState }),
  dismissStep: useDismissStep({ setState }),
  deleteStep: useDeleteStep({ setState }),

  moveCalculation: useMoveCalculation({ setState }),

  createCalculation: useCreateCalculation({ setState }),
  selectCalculation: useSelectCalculation({ setState }),
  updatePropCalculation: useUpdatePropCalculation({ setState }),
  updateAttributeCalculation: useUpdateAttributeCalculation({ setState }),

  canSelectNodeDef: useCanSelectNodeDef(),

  // save: useSave({
  //   setState,
  // }),

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
