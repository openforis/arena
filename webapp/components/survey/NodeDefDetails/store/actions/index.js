import { useSetProp } from './useSetProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSaveEdits } from './useSaveEdits'
import { useCancelEdits } from './useCancelEdits'

export const useActions = ({ state, setState }) => ({
  setProp: useSetProp({ state, setState }),
  setParentUuid: useSetParentUuid({ state, setState }),
  setLayoutProp: useSetLayoutProp({ state, setState }),
  saveEdits: useSaveEdits({ state, setState }),
  cancelEdits: useCancelEdits({ state }),
})
