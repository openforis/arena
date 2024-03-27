import { useDelete } from './useDelete'
import { useEdit } from './useEdit'
import { useExportAll } from './useExportAll'
import { useSelect } from './useSelect'
import { useStartBatchImport } from './useStartBatchImport'

export const useActions = ({ setState }) => ({
  delete: useDelete(),
  edit: useEdit({ setState }),
  select: useSelect({ setState }),
  exportAll: useExportAll(),
  startBatchImport: useStartBatchImport({ setState }),
})
