import * as A from '@core/arena'

const keys = {
  inputValue: 'inputValue',
  itemsDialog: 'itemsDialog',
  showDialog: 'showDialog',
  // from props
  autocompleteMinChars: 'autocompleteMinChars',
  disabled: 'disabled',
  itemKey: 'itemKey',
  itemLabel: 'itemLabel',
  items: 'items',
  readOnly: 'readOnly',
  customItemsFilter: 'customItemsFilter',
}

// ====== READ
export const getInputValue = A.prop(keys.inputValue)
export const getItemsDialog = A.prop(keys.itemsDialog)
export const getShowDialog = A.prop(keys.showDialog)
export const getAutocompleteMinChars = A.prop(keys.autocompleteMinChars)
export const getDisabled = A.prop(keys.disabled)
export const getItems = A.prop(keys.items)
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabel = A.prop(keys.itemLabel)
export const getReadOnly = A.prop(keys.readOnly)
export const getCustomItemsFilter = A.prop(keys.customItemsFilter)

// ====== UPDATE
export const assocInputValue = A.assoc(keys.inputValue)
export const assocItemsDialog = A.assoc(keys.itemsDialog)
export const assocShowDialog = A.assoc(keys.showDialog)
export const assocCustomItemsFilter = A.assoc(keys.customItemsFilter)

// ====== CREATE
const _createGetItemProp = (prop) => (prop.constructor === String ? A.prop(prop) : (item) => prop(item))

export const create = ({
  autocompleteMinChars,
  disabled,
  items,
  itemKey,
  itemLabel,
  readOnly,
  selection,
  customItemsFilter,
}) => {
  const state = {
    [keys.autocompleteMinChars]: autocompleteMinChars,
    [keys.disabled]: disabled,
    [keys.items]: items,
    [keys.itemsDialog]: items,
    [keys.itemKey]: _createGetItemProp(itemKey),
    [keys.itemLabel]: _createGetItemProp(itemLabel),
    [keys.readOnly]: readOnly,
    [keys.showDialog]: false,
    [keys.customItemsFilter]: customItemsFilter,
  }
  const inputValue = A.isEmpty(selection) ? '' : getItemLabel(state)(selection)
  return assocInputValue(inputValue, state)
}
