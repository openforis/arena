import { useDelete } from './useDelete'
import { useEdit } from './useEdit'
import { useSelect } from './useSelect'

export const useActions = ({ setState }) => ({
  delete: useDelete({ setState }),
  edit: useEdit({ setState }),
  select: useSelect({ setState }),
})
