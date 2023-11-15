import { useDelete } from './useDelete'
import { useEdit } from './useEdit'
import { useSelect } from './useSelect'
import { useExportAll } from './useExportAll'
import { useStartBatchImport } from './useStartBatchImport'

export const useActions = ({ setState }) => ({
  delete: useDelete(),
  edit: useEdit({ setState }),
  select: useSelect({ setState }),
  exportAll: useExportAll(),
  startBatchImport: useStartBatchImport({ setState }),
})
