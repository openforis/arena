import { useSetProp } from './useSetProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSetEditableIfMode } from './useSetEditableIfMode'
import { useSetVisibleIfMode } from './useSetVisibleIfMode'
import { useSaveEdits } from './useSaveEdits'
import { useCancelEdits } from './useCancelEdits'
import { useGoToNodeDef } from './useGoToNodeDef'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'

export const useActions = ({ setState }) => ({
  setProp: useSetProp({ setState }),
  setParentUuid: useSetParentUuid({ setState }),
  setLayoutProp: useSetLayoutProp({ setState }),
  setEditableIfMode: useSetEditableIfMode({ setState }),
  setVisibleIfMode: useSetVisibleIfMode({ setState }),
  saveEdits: useSaveEdits({ setState }),
  cancelEdits: useCancelEdits({ setState }),
  goToNodeDef: useGoToNodeDef({ setState }),
  getSiblingNodeDefUuid: useGetSiblingNodeDefUuid(),
})
