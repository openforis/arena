import * as A from '@core/arena'
import * as R from 'ramda'
import { elementOffset } from '@webapp/utils/domUtils'

const keys = {
  inputField: 'inputField',
  sourceElement: 'sourceElement',
  items: 'items',
  itemLabel: 'itemLabel',
  itemKey: 'itemKey',

  focusedItemIndex: 'focusedItemIndex',
  list: 'list',
}

// ====== READ
export const getInputField = A.prop(keys.inputField)
export const getSourceElement = A.prop(keys.sourceElement)
export const getItems = A.prop(keys.items)
export const getItemLabel = A.prop(keys.itemLabel)
export const getItemKey = A.prop(keys.itemKey)
export const getFocusedItemIndex = A.prop(keys.focusedItemIndex)
export const getList = A.prop(keys.list)

export const getItemsSize = (state) => getItems(state).length

export const calculatePosition = (state) => {
  const { top, left, height, width } = elementOffset(getSourceElement(state) || getInputField(state))
  return {
    top: top + height,
    left,
    width,
  }
}

// ====== CREATE
const _createGetItemProp = (prop) => (prop.constructor === String ? A.prop(prop) : (item) => prop(item))

export const create = ({ inputField, sourceElement, items, itemLabel, itemKey, list }) => ({
  [keys.inputField]: inputField,
  [keys.sourceElement]: sourceElement,
  [keys.items]: items,
  [keys.itemLabel]: _createGetItemProp(itemLabel),
  [keys.itemKey]: _createGetItemProp(itemKey),
  [keys.focusedItemIndex]: null,
  [keys.list]: list,
})

// ===== UPDATE

export const assocFocusedItemIndex = R.assoc(keys.focusedItemIndex)
export const assocItems = R.assoc(keys.items)
export const assocInputField = R.assoc(keys.inputField)
export const assocList = R.assoc(keys.list)
