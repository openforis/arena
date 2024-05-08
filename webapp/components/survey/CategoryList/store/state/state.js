import * as A from '@core/arena'

export const keys = {
  canSelect: 'canSelect',
  categoriesRequestedAt: 'categoriesRequestedAt',
  onCategoryCreated: 'onCategoryCreated',
  onCategoryOpen: 'onCategoryOpen',
  onSelect: 'onSelect',
  selectedItemUuid: 'selectedItemUuid',
}

// ==== CREATE
export const create = ({ canSelect, onCategoryCreated, onCategoryOpen, onSelect, selectedItemUuid }) => ({
  [keys.canSelect]: canSelect,
  [keys.onCategoryCreated]: onCategoryCreated,
  [keys.onCategoryOpen]: onCategoryOpen,
  [keys.onSelect]: onSelect,
  [keys.selectedItemUuid]: selectedItemUuid,
  [keys.categoriesRequestedAt]: Date.now(),
})

// ==== READ
export const getCanSelect = A.prop(keys.canSelect)
export const getCategoriesRequestedAt = A.prop(keys.categoriesRequestedAt)
export const getOnCategoryCreated = A.prop(keys.onCategoryCreated)
export const getOnCategoryOpen = A.prop(keys.onCategoryOpen)
export const getOnSelect = A.prop(keys.onSelect)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
