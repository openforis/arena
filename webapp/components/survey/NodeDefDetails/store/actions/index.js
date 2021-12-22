import { useSetProp } from './useSetProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSaveEdits } from './useSaveEdits'
import { useCancelEdits } from './useCancelEdits'
import { useGoToNodeDef } from './useGoToNodeDef'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'

export const useActions = ({ setState }) => ({
  setProp: useSetProp({ setState }),
  setParentUuid: useSetParentUuid({ setState }),
  setLayoutProp: useSetLayoutProp({ setState }),
  saveEdits: useSaveEdits({ setState }),
  cancelEdits: useCancelEdits({ setState }),
  goToNodeDef: useGoToNodeDef({ setState }),
  getSiblingNodeDefUuid: useGetSiblingNodeDefUuid(),
})
