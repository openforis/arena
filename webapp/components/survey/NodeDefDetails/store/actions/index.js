import { useSetNodeDefProp } from './useSetNodeDefProp'

export const useActions = ({ nodeDefState, setNodeDefState }) => ({
  setNodeDefProp: useSetNodeDefProp({ nodeDefState, setNodeDefState }),
})
