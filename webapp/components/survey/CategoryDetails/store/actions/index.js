import { useInit } from './useInit'
import { useUpdateCategoryProp } from './useUpdateCategoryProp'
import { useUploadCategory } from './useUploadCategory'
import { useHideImportSummary } from './useHideImportSummary'
import { useSetImportSummaryColumnDataType } from './useSetImportSummaryColumnDataType'
import { useImportCategory } from './useImportCategory'
import { useFetchLevelItems } from './useFetchLevelItems'
import { useDeleteLevel } from './useDeleteLevel'
import { useUpdateLevelProp } from './useUpdateLevelProp'
import { useCreateLevel } from './useCreateLevel'
import { useSetItemActive } from './useSetItemActive'
import { useResetItemActive } from './useResetItemActive'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),

  // Category
  updateCategoryProp: useUpdateCategoryProp({ setState }),
  uploadCategory: useUploadCategory({ setState }),
  hideImportSummary: useHideImportSummary({ setState }),
  setImportSummaryColumnDataType: useSetImportSummaryColumnDataType({ setState }),
  importCategory: useImportCategory({ setState }),

  // Levels
  fetchLevelItems: useFetchLevelItems({ setState }),
  deleteLevel: useDeleteLevel({ setState }),
  updateLevelProp: useUpdateLevelProp({ setState }),
  createLevel: useCreateLevel({ setState }),

  // Items
  setItemActive: useSetItemActive({ setState }),
  resetItemActive: useResetItemActive({ setState }),
})
