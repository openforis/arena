import { useDelete } from './useDelete'
import { useSelect } from './useSelect'

export const useActions = () => ({
  delete: useDelete(),
  select: useSelect(),
})
