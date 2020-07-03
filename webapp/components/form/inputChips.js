import './inputChips.scss'

import React from 'react'
import * as R from 'ramda'

import Dropdown from './Dropdown'

const extractValueFromFunctionOrProp = (item, func, prop, defaultProp) =>
  R.is(Object, item)
    ? func
      ? func(item)
      : prop
      ? R.prop(prop)(item)
      : R.has(defaultProp)(item)
      ? R.prop(defaultProp)(item)
      : item
    : item // Primitive

const getItemLabel = (item, itemLabelFunction, itemLabelProp) =>
  extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value')

const getItemKey = (item, itemKeyFunction, itemKeyProp) =>
  extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')

const Chip = (props) => {
  const { item, itemLabelFunction, itemLabelProp, onDelete, canBeRemoved, readOnly } = props

  return (
    <div className="form-input">
      <div className="form-input-chip-item">
        {getItemLabel(item, itemLabelFunction, itemLabelProp)}

        {!readOnly && (
          <button className="btn btn-s btn-remove" onClick={() => onDelete(item)} aria-disabled={!canBeRemoved}>
            <span className="icon icon-cross icon-8px" />
          </button>
        )}
      </div>
    </div>
  )
}

const InputChips = (props) => {
  const {
    items,
    itemsLookupFunction,
    itemKeyProp,
    itemKeyFunction,
    itemLabelFunction,
    itemLabelProp,
    selection,
    requiredItems,
    dropdownAutocompleteMinChars,
    readOnly,
    disabled,
    validation,
    onChange,
    onItemAdd,
    onItemRemove,
  } = props

  const onDropdownChange = (item) => {
    if (item) {
      if (onChange) {
        const newItems = R.append(item)(selection)
        onChange(newItems)
      }

      if (onItemAdd) {
        onItemAdd(item)
      }
    }
  }

  const removeItem = (item) => {
    if (onChange) {
      const idx = R.indexOf(item)(selection)
      const newItems = R.remove(idx, 1, selection)
      onChange(newItems)
    }

    if (onItemRemove) {
      onItemRemove(item)
    }
  }

  const rejectSelectedItems = R.reject((item) => R.includes(item, selection))

  const dropdownItems = rejectSelectedItems(items)

  const dropdownItemsLookupFunction = itemsLookupFunction
    ? async (value) => rejectSelectedItems(await itemsLookupFunction(value))
    : null

  const showDropdown = !readOnly && (!R.isEmpty(dropdownItems) || itemsLookupFunction)

  return (
    <div className="form-input-chip">
      {selection.map((item) => (
        <Chip
          key={getItemKey(item, itemKeyFunction, itemKeyProp)}
          item={item}
          itemKeyProp={itemKeyProp}
          itemKeyFunction={itemKeyFunction}
          itemLabelFunction={itemLabelFunction}
          itemLabelProp={itemLabelProp}
          onDelete={removeItem}
          canBeRemoved={selection.length > requiredItems}
          readOnly={readOnly}
        />
      ))}

      {showDropdown && (
        <Dropdown
          items={items.length > 0 ? dropdownItems : dropdownItemsLookupFunction}
          itemKey={itemKeyFunction || itemKeyProp}
          itemLabel={itemLabelFunction || itemLabelProp}
          onChange={onDropdownChange}
          selection={null}
          autocompleteMinChars={dropdownAutocompleteMinChars}
          readOnly={readOnly}
          disabled={disabled}
          validation={validation}
        />
      )}
    </div>
  )
}

// TODO When refactoring InputChips:
// 1. items and itemsLookupFunction become one required prop `items` array or function (see dropdown)
// 2. `itemKeyProp` and `itemKeyFunction` become one required prop `itemKey` string or function (see dropdown)
// 3. `itemLabelProp` and `itemLabelFunction` become required one prop `itemLabel` string or function (see dropdown)
// 4: `dropdownAutocompleteMinChars` must be renamed to autocompleteMinChars

InputChips.defaultProps = {
  items: [],
  itemsLookupFunction: null, // Async function to find items by specified value
  itemKeyFunction: null,
  itemKeyProp: 'key',
  itemLabelFunction: null,
  itemLabelProp: 'value',
  selection: [],
  requiredItems: 0,
  dropdownAutocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  validation: {},
  onChange: null, // Callback to receive all selection change
  onItemAdd: null, // Callback to receive added item
  onItemRemove: null, // Callback to receive removed item
}

export default InputChips
