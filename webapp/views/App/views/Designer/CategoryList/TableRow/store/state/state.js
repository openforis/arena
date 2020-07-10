import * as A from '@core/arena'
import * as Category from '@core/survey/category'

export const keys = {
  canSelect: 'canSelect',
  category: 'taxonomy',
  inCategoriesPath: 'inCategoriesPath',
  initData: 'initData',
  position: 'position',
  onSelect: 'onSelect',
  selectedItemUuid: 'selectedItemUuid',
  unused: 'unused',
}

// ==== CREATE
export const create = ({
  canSelect,
  category,
  inCategoriesPath,
  initData,
  onSelect,
  position,
  selectedItemUuid,
  unused,
}) => ({
  [keys.canSelect]: canSelect,
  [keys.category]: category,
  [keys.inCategoriesPath]: inCategoriesPath,
  [keys.initData]: initData,
  [keys.position]: position,
  [keys.onSelect]: onSelect,
  [keys.selectedItemUuid]: selectedItemUuid,
  [keys.unused]: unused,
})

// ==== READ
export const getCanDelete = A.prop(keys.canDelete)
export const getCanSelect = A.prop(keys.canSelect)
export const getCategory = A.prop(keys.category)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)
export const getInitData = A.prop(keys.initData)
export const getOnSelect = A.prop(keys.onSelect)
export const getPosition = A.prop(keys.position)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)
export const isUnused = A.prop(keys.unused)

export const isSelected = (state) => {
  const selectedItemUuid = getSelectedItemUuid(state)
  return selectedItemUuid && selectedItemUuid === Category.getUuid(getCategory(state))
}

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
