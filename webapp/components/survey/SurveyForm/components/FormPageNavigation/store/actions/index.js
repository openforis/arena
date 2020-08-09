import { useToggleShowChildren } from './useToggleShowChildren'
import { useToggleExpand } from './useToggleExpand'
import { useSelect } from './useSelect'

export const useActions = ({ setState }) => ({
  toggleShowChildren: useToggleShowChildren({ setState }),
  toggleExpand: useToggleExpand(),
  select: useSelect(),
})
