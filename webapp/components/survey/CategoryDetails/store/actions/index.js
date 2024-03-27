import { useCleanupCategory } from './category/useCleanupCategory'
import { useConvertToReportingDataCategory } from './category/useConvertToReportingDataCategory'
import { useConvertToSimpleCategory } from './category/useConvertToSimpleCategory'
import { useInit } from './category/useInit'
import { useOnDoneClick } from './category/useOnDoneClick'
import { useToggleEditExtraPropertiesPanel } from './category/useToggleEditExtraPropertiesPanel'
import { useUpdateCategoryItemExtraPropItem } from './category/useUpdateCategoryItemExtraPropItem'
import { useUpdateCategoryProp } from './category/useUpdateCategoryProp'
import { useUploadCategory } from './category/useUploadCategory'
import { useHideImportSummary } from './importSummary/useHideImportSummary'
import { useImportCategory } from './importSummary/useImportCategory'
import { useSetImportSummaryColumnDataType } from './importSummary/useSetImportSummaryColumnDataType'
import { useCreateItem } from './item/useCreateItem'
import { useDeleteItem } from './item/useDeleteItem'
import { useFetchLevelItems } from './item/useFetchLevelItems'
import { useResetItemActive } from './item/useResetItemActive'
import { useSetItemActive } from './item/useSetItemActive'
import { useUpdateItemProp } from './item/useUpdateItemProp'
import { useCreateLevel } from './level/useCreateLevel'
import { useDeleteLevel } from './level/useDeleteLevel'
import { useUpdateLevelProp } from './level/useUpdateLevelProp'

export const useActions = ({ setState }) => ({
  init: useInit({ setState }),

  // Category
  updateCategoryProp: useUpdateCategoryProp({ setState }),
  updateCategoryItemExtraPropItem: useUpdateCategoryItemExtraPropItem({ setState }),
  uploadCategory: useUploadCategory({ setState }),
  hideImportSummary: useHideImportSummary({ setState }),
  setImportSummaryColumnDataType: useSetImportSummaryColumnDataType({ setState }),
  importCategory: useImportCategory({ setState }),
  cleanupCategory: useCleanupCategory({ setState }),
  convertToReportingDataCategory: useConvertToReportingDataCategory({ setState }),
  convertToSimpleCategory: useConvertToSimpleCategory({ setState }),
  onDoneClick: useOnDoneClick({ setState }),
  toggleEditExtraPropertiesPanel: useToggleEditExtraPropertiesPanel({ setState }),

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
