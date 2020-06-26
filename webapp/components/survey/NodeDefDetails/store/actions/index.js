import { useSetNodeDefProp } from './useSetNodeDefProp'
import { useSetNodeDefParentUuid } from './useSetNodeDefParentUuid'
import { useSetNodeDefLayoutProp } from './useSetNodeDefLayoutProp'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setNodeDefProp: useSetNodeDefProp({ nodeDefState, setNodeDefState }),
  setNodeDefParentUuid: useSetNodeDefParentUuid({ nodeDefState, setNodeDefState }),
  setNodeDefLayoutProp: useSetNodeDefLayoutProp({ nodeDefState, setNodeDefState }),
})
