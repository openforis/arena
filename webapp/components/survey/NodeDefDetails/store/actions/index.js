import { useCancelEdits } from './useCancelEdits'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'
import { useGoToNodeDef } from './useGoToNodeDef'
import { useSaveEdits } from './useSaveEdits'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetProp } from './useSetProp'

export const useActions = ({ setState }) => ({
  setProp: useSetProp({ setState }),
  setParentUuid: useSetParentUuid({ setState }),
  setLayoutProp: useSetLayoutProp({ setState }),
  saveEdits: useSaveEdits({ setState }),
  cancelEdits: useCancelEdits({ setState }),
  goToNodeDef: useGoToNodeDef({ setState }),
  getSiblingNodeDefUuid: useGetSiblingNodeDefUuid(),
})
