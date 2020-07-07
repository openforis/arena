import { useDelete } from './useDelete'
import { useEdit } from './useEdit'
import { useSelect } from './useSelect'

export const useActions = () => ({
  delete: useDelete(),
  edit: useEdit(),
  select: useSelect(),
})
