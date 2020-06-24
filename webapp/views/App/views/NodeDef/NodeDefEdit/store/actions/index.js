import { useSetNodeDefProp } from './useSetNodeDefProp'
import { useSetNodeDefLayoutProp } from './useSetNodeDefLayoutProp'
import { useSetNodeDefParentUuid } from './useSetNodeDefParentUuid'
import { useCancelNodeDefEdits } from './useCancelNodeDefEdits'
import { useSaveNodeDefEdits } from './useSaveNodeDefEdits'
import { usePutNodeDefLayoutProp } from './usePutNodeDefLayoutProp'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setNodeDefProp: useSetNodeDefProp({ nodeDefState, setNodeDefState }),
  setNodeDefLayoutProp: useSetNodeDefLayoutProp({ nodeDefState, setNodeDefState }),
  setNodeDefParentUuid: useSetNodeDefParentUuid({ nodeDefState, setNodeDefState }),
  cancelNodeDefEdits: useCancelNodeDefEdits({ nodeDefState }),
  saveNodeDefEdits: useSaveNodeDefEdits({ nodeDefState, setNodeDefState }),
  putNodeDefLayoutProp: usePutNodeDefLayoutProp(),
})
