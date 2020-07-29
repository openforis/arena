import * as A from '@core/arena'

const keys = {
  // from props
  itemLabel: 'itemLabel',
  itemKey: 'itemKey',
}

// ====== READ
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabel = A.prop(keys.itemLabel)

// ====== CREATE
const _createGetItemProp = (prop) => (prop.constructor === String ? A.prop(prop) : (item) => prop(item))

export const create = ({ itemLabel, itemKey }) => ({
  [keys.itemLabel]: _createGetItemProp(itemLabel),
  [keys.itemKey]: _createGetItemProp(itemKey),
})
