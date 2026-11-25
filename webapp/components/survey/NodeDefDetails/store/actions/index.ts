import { useCancelEdits } from './useCancelEdits'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'
import { useGoToNodeDef } from './useGoToNodeDef'
import { useSaveEdits } from './useSaveEdits'
import { useSetEditableIfMode } from './useSetEditableIfMode'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetProp } from './useSetProp'
import { useSetVisibleIfMode } from './useSetVisibleIfMode'

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
