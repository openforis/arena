import { useInit } from './useInit'
import { useUpdateCategoryProp } from './useUpdateCategoryProp'
import { useUploadCategory } from './useUploadCategory'
import { useHideImportSummary } from './useHideImportSummary'
import { useSetImportSummaryColumnDataType } from './useSetImportSummaryColumnDataType'
import { useImportCategory } from './useImportCategory'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),
  updateCategoryProp: useUpdateCategoryProp({ setState }),
  uploadCategory: useUploadCategory({ setState }),
  hideImportSummary: useHideImportSummary({ setState }),
  setImportSummaryColumnDataType: useSetImportSummaryColumnDataType({ setState }),
  importCategory: useImportCategory({ setState }),
})
