import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'

const keys = {
  // from props
  itemLabel: 'itemLabel',
  itemKey: 'itemKey',
  // only for InputChipText
  inputFieldValue: 'inputFieldValue',
  textTransformFunction: 'textTransformFunction',
  isInputFieldValueValid: 'isInputFieldValueValid',
}

// ====== READ
export const getItemKey = A.prop(keys.itemKey)
export const getItemLabel = A.prop(keys.itemLabel)
export const getInputFieldValue = A.propOr('', keys.inputFieldValue)
export const getTextTransformFunction = A.prop(keys.textTransformFunction)
export const getIsInputFieldValueValid = A.prop(keys.isInputFieldValueValid)

// ====== CREATE
const _createGetItemProp =
  (prop = null) =>
  (item) => {
    if (!prop) return item
    if (prop.constructor === String) return A.prop(prop)(item)
    return prop(item)
  }

export const create = ({
  itemLabel = null,
  itemKey = null,
  isInputFieldValueValid = null,
  textTransformFunction = null,
} = {}) => ({
  [keys.itemLabel]: _createGetItemProp(itemLabel),
  [keys.itemKey]: _createGetItemProp(itemKey),
  [keys.isInputFieldValueValid]: isInputFieldValueValid,
  [keys.textTransformFunction]: textTransformFunction,
})

// ===== UPDATE
export const assocInputFieldValue = A.assoc(keys.inputFieldValue)

// ===== UTILS
export const isValueValid = (value) => (state) => {
  const isInputFieldValueValid = getIsInputFieldValueValid(state)
  if (!isInputFieldValueValid) return true
  return !Objects.isEmpty(value) && isInputFieldValueValid(value)
}

export const canAddItem = (state) => isValueValid(getInputFieldValue(state))(state)
