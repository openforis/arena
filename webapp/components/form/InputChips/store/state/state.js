import * as A from '@core/arena'

const keys = {
  // from props
  itemLabel: 'itemLabel',
  itemKey: 'itemKey',
  // only for InputChipText
  inputFieldValue: 'inputFieldValue',
  textTransformFunction: 'textTransformFunction',
}

// ====== READ
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabel = A.prop(keys.itemLabel)
export const getInputFieldValue = A.prop(keys.inputFieldValue)
export const getTextTransformFunction = A.prop(keys.textTransformFunction)

// ====== CREATE
const _createGetItemProp =
  (prop = null) =>
  (item) => {
    if (!prop) return item
    if (prop.constructor === String) return A.prop(item)
    return prop(item)
  }

export const create = ({ itemLabel = null, itemKey = null, textTransformFunction = null } = {}) => ({
  [keys.itemLabel]: _createGetItemProp(itemLabel),
  [keys.itemKey]: _createGetItemProp(itemKey),
  [keys.textTransformFunction]: textTransformFunction,
})

// ===== UPDATE
export const assocInputFieldValue = A.assoc(keys.inputFieldValue)
