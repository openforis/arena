import { useSetNodeDefProp } from './useSetNodeDefProp'
import { useSetNodeDefParentUuid } from './useSetNodeDefParentUuid'
import { useSetNodeDefLayoutProp } from './useSetNodeDefLayoutProp'
import { useSaveNodeDefEdits } from './useSaveNodeDefEdits'
import { useCancelNodeDefEdits } from './useCancelNodeDefEdits'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setNodeDefProp: useSetNodeDefProp({ nodeDefState, setNodeDefState }),
  setNodeDefParentUuid: useSetNodeDefParentUuid({ nodeDefState, setNodeDefState }),
  setNodeDefLayoutProp: useSetNodeDefLayoutProp({ nodeDefState, setNodeDefState }),
  saveNodeDefEdits: useSaveNodeDefEdits({ nodeDefState, setNodeDefState }),
  cancelNodeDefEdits: useCancelNodeDefEdits({ nodeDefState, setNodeDefState }),
})
