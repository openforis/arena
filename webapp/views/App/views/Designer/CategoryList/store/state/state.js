import * as A from '@core/arena'

export const keys = {
  canSelect: 'canSelect',
  inCategoriesPath: 'inCategoriesPath',
  onAdd: 'onAdd',
  onEdit: 'onEdit',
  onSelect: 'onSelect',
  selectedItemUuid: 'selectedItemUuid',
}

// ==== CREATE
export const create = ({ canSelect, inCategoriesPath, onAdd, onEdit, onSelect, selectedItemUuid }) => ({
  [keys.canSelect]: canSelect,
  [keys.inCategoriesPath]: inCategoriesPath,
  [keys.onAdd]: onAdd,
  [keys.onEdit]: onEdit,
  [keys.onSelect]: onSelect,
  [keys.selectedItemUuid]: selectedItemUuid,
})

// ==== READ
export const getCanSelect = A.prop(keys.canSelect)
export const getOnAdd = A.prop(keys.onAdd)
export const getOnEdit = A.prop(keys.onEdit)
export const getOnSelect = A.prop(keys.onSelect)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
