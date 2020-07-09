import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  taxonomy: 'taxonomy',
  deleted: 'deleted',
  canDelete: 'canDelete',
  selectedItemUuid: 'selectedItemUuid',
  onSelect: 'onSelect',
  canSelect: 'canSelect',
  initData: 'initData',
  onOpenTaxonomy: 'onOpenTaxonomy',
}

// ==== CREATE
export const create = ({
  taxonomy,
  canDelete,
  selectedItemUuid,
  onSelectTaxonomy,
  canSelect,
  initData,
  onOpenTaxonomy,
}) => ({
  [keys.taxonomy]: taxonomy,
  [keys.deleted]: false,
  [keys.canDelete]: canDelete,
  [keys.selectedItemUuid]: selectedItemUuid,
  [keys.onSelect]: onSelectTaxonomy,
  [keys.canSelect]: canSelect,
  [keys.initData]: initData,
  [keys.onOpenTaxonomy]: onOpenTaxonomy,
})

// ==== READ
export const getOnSelect = A.prop(keys.onSelect)
export const getOnOpenTaxonomy = A.prop(keys.onOpenTaxonomy)
export const getInitData = A.prop(keys.initData)
export const getTaxonomy = A.prop(keys.taxonomy)
export const getSelectedItemUuid = A.prop(keys.selectedItemUuid)
export const getCanSelect = A.prop(keys.canSelect)

export const getSelected = (state) =>
  !A.isEmpty(getSelectedItemUuid(state)) && getSelectedItemUuid(state) === ObjectUtils.getUuid(getTaxonomy(state))

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
