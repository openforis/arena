import { useInit } from './category/useInit'
import { useUpdateCategoryProp } from './category/useUpdateCategoryProp'
import { useUploadCategory } from './category/useUploadCategory'
import { useImportCategory } from './importSummary/useImportCategory'
import { useHideImportSummary } from './importSummary/useHideImportSummary'
import { useSetImportSummaryColumnDataType } from './importSummary/useSetImportSummaryColumnDataType'
import { useDeleteLevel } from './level/useDeleteLevel'
import { useUpdateLevelProp } from './level/useUpdateLevelProp'
import { useCreateLevel } from './level/useCreateLevel'
import { useCreateItem } from './item/useCreateItem'
import { useFetchLevelItems } from './item/useFetchLevelItems'
import { useSetItemActive } from './item/useSetItemActive'
import { useResetItemActive } from './item/useResetItemActive'
import { useUpdateItemProp } from './item/useUpdateItemProp'
import { useDeleteItem } from './item/useDeleteItem'

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
  createItem: useCreateItem({ setState }),
  setItemActive: useSetItemActive({ setState }),
  resetItemActive: useResetItemActive({ setState }),
  updateItemProp: useUpdateItemProp({ setState }),
  deleteItem: useDeleteItem({ setState }),
})
