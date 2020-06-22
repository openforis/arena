import { useSetNodeDefProp } from './useSetNodeDefProp'
import { useSetNodeDefLayoutProp } from './useSetNodeDefLayoutProp'
import { useSetNodeDefParentUuid } from './useSetNodeDefParentUuid'
import { useCancelNodeDefEdits } from './useCancelNodeDefEdits'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setNodeDefProp: useSetNodeDefProp({ nodeDefState, setNodeDefState }),
  setNodeDefLayoutProp: useSetNodeDefLayoutProp({ nodeDefState, setNodeDefState }),
  setNodeDefParentUuid: useSetNodeDefParentUuid({ nodeDefState, setNodeDefState }),
  cancelNodeDefEdits: useCancelNodeDefEdits({ nodeDefState }),
})
