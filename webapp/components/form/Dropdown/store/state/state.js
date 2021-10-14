import * as A from '@core/arena'

const keys = {
  inputValue: 'inputValue',
  itemsDialog: 'itemsDialog',
  showDialog: 'showDialog',
  // from props
  autocompleteMinChars: 'autocompleteMinChars',
  disabled: 'disabled',
  itemKey: 'itemKey',
  itemLabelFunction: 'itemLabelFunction',
  items: 'items',
  readOnly: 'readOnly',
}

// ====== READ
export const getInputValue = A.prop(keys.inputValue)
export const getItemsDialog = A.prop(keys.itemsDialog)
export const getShowDialog = A.prop(keys.showDialog)
export const getAutocompleteMinChars = A.prop(keys.autocompleteMinChars)
export const getDisabled = A.prop(keys.disabled)
export const getItems = A.prop(keys.items)
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabelFunction = A.prop(keys.itemLabelFunction)
export const getReadOnly = A.prop(keys.readOnly)

// ====== UPDATE
export const assocDisabled = A.assoc(keys.disabled)
export const assocInputValue = A.assoc(keys.inputValue)
export const assocItemLabelFunction = A.assoc(keys.itemLabelFunction)
export const assocItems = A.assoc(keys.items)
export const assocItemsDialog = A.assoc(keys.itemsDialog)
export const assocShowDialog = A.assoc(keys.showDialog)

// ====== CREATE
const _createGetItemProp = (prop) => (prop.constructor === String ? A.prop(prop) : (item) => prop(item))

export const create = ({ autocompleteMinChars, disabled, items, itemKey, itemLabelFunction, readOnly, selection }) => ({
  [keys.autocompleteMinChars]: autocompleteMinChars,
  [keys.disabled]: disabled,
  [keys.inputValue]: A.isEmpty(selection) ? '' : itemLabelFunction(selection),
  [keys.items]: items,
  [keys.itemsDialog]: items,
  [keys.itemKey]: _createGetItemProp(itemKey),
  [keys.itemLabelFunction]: itemLabelFunction,
  [keys.readOnly]: readOnly,
  [keys.showDialog]: false,
})
