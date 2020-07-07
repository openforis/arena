import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  taxonomy: 'taxonomy',
  deleted: 'deleted',
  canDelete: 'canDelete',
  selectedItemUuid: 'selectedItemUuid',
  onSelectTaxonomy: 'onSelectTaxonomy',
  canSelect: 'canSelect',
}

// ==== CREATE
export const create = ({ row: taxonomy, canDelete, selectedItemUuid, onSelectTaxonomy, canSelect }) => ({
  [keys.taxonomy]: taxonomy,
  [keys.deleted]: false,
  [keys.canDelete]: canDelete,
  [keys.selectedItemUuid]: selectedItemUuid,
  [keys.onSelectTaxonomy]: onSelectTaxonomy,
  [keys.canSelect]: canSelect,
})

// ==== READ
export const getOnSelectTaxonomy = A.prop(keys.onSelectTaxonomy)
export const getTaxonomy = A.prop(keys.taxonomy)
export const getDeleted = A.prop(keys.deleted)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)
export const getCanSelect = A.prop(keys.canSelect)

export const getSelected = (state) => getSelectedItemUuid(state) === ObjectUtils.getUuid(getTaxonomy(state))

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
export const assocDeleted = A.assoc(keys.deleted)
