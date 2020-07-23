import * as A from '@core/arena'

const keys = {
  // from props
  items: 'items',
  itemLabel: 'itemLabel',
  itemKey: 'itemKey',

  requiredItems: 'requiredItems',
  disabled: 'disabled',
  readOnly: 'readOnly',
}

// ====== READ
export const getItems = A.prop(keys.items)
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabel = A.prop(keys.itemLabel)

export const getRequiredItems = A.prop(keys.requiredItems)
export const getDisabled = A.prop(keys.disabled)
export const getReadOnly = A.prop(keys.readOnly)

// ====== CREATE
const _createGetItemProp = (prop) => (prop.constructor === String ? A.prop(prop) : (item) => prop(item))

export const create = ({ items, itemLabel, itemKey, requiredItems, disabled, readOnly }) => ({
  [keys.items]: items,
  [keys.itemLabel]: _createGetItemProp(itemLabel),
  [keys.itemKey]: _createGetItemProp(itemKey),

  [keys.requiredItems]: requiredItems,
  [keys.disabled]: disabled,
  [keys.readOnly]: readOnly,
})
