import { useSetProp } from './useSetNodeDefProp'
import { useSetParentUuid } from './useSetParentUuid'
import { useSetLayoutProp } from './useSetLayoutProp'
import { useSaveEdits } from './useSaveEdits'
import { useCancelEdits } from './useCancelEdits'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setProp: useSetProp({ nodeDefState, setNodeDefState }),
  setParentUuid: useSetParentUuid({ nodeDefState, setNodeDefState }),
  setLayoutProp: useSetLayoutProp({ nodeDefState, setNodeDefState }),
  saveEdits: useSaveEdits({ nodeDefState, setNodeDefState }),
  cancelEdits: useCancelEdits({ nodeDefState }),
})
