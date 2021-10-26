import { useDelete } from './useDelete'
import { useEdit } from './useEdit'
import { useSelect } from './useSelect'
import { useExportAll } from './useExportAll'

export const useActions = ({ setState }) => ({
  delete: useDelete(),
  edit: useEdit({ setState }),
  select: useSelect({ setState }),
  exportAll: useExportAll(),
})
