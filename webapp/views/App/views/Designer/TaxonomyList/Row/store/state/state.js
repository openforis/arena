import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  taxonomy: 'taxonomy',
  deleted: 'deleted',
  canDelete: 'canDelete',
  selectedItemUuid: 'selectedItemUuid',
  onSelect: 'onSelect',
  canSelect: 'canSelect',
  refetch: 'refetch',
}

// ==== CREATE
export const create = ({ taxonomy, canDelete, selectedItemUuid, onSelectTaxonomy, canSelect, refetchData }) => ({
  [keys.taxonomy]: taxonomy,
  [keys.deleted]: false,
  [keys.canDelete]: canDelete,
  [keys.selectedItemUuid]: selectedItemUuid,
  [keys.onSelect]: onSelectTaxonomy,
  [keys.canSelect]: canSelect,
  [keys.refetch]: refetchData,
})

// ==== READ
export const getOnSelect = A.prop(keys.onSelect)
export const getRefetch = A.prop(keys.refetch)
export const getTaxonomy = A.prop(keys.taxonomy)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)
export const getCanSelect = A.prop(keys.canSelect)

export const getSelected = (state) =>
  !A.isEmpty(getSelectedItemUuid(state)) && getSelectedItemUuid(state) === ObjectUtils.getUuid(getTaxonomy(state))

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
