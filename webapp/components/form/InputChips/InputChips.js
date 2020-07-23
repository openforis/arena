import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Dropdown from '../Dropdown'
import Chip from './Chip'

import { useInputChips, State } from './store'

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

const getItemKey = (item, itemKeyFunction, itemKeyProp) =>
  extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')

const InputChips = (props) => {
  const {
    items,
    itemKey,
    itemLabel,
    selection,
    requiredItems,
    autocompleteMinChars,
    readOnly,
    disabled,
    validation,
    onChange,
    onItemAdd,
    onItemRemove,
  } = props

  const { state, Actions } = useInputChips({
    items,
    itemKey,
    itemLabel,
    selection,
    readOnly,
    disabled,
    validation,
    onChange,
    onItemAdd,
    onItemRemove,
  })

  const rejectSelectedItems = R.reject((item) => R.includes(item, selection))
  console.log( selection, items)

  const dropdownItems = rejectSelectedItems(items)
  console.log( selection, items)

  /*const dropdownItemsLookupFunction = itemsLookupFunction
    ? async (value) => rejectSelectedItems(await itemsLookupFunction(value))
    : null*/

  const showDropdown = !readOnly && !R.isEmpty(dropdownItems)

  return (
    <div className="form-input-chip">
      {selection.map((item) => (
        <Chip
          key={State.getItemKey(state)}
          item={item}
          itemKey={State.getItemKey(state)}
          itemLabelFunction={State.getItemLabel(state)}
          onDelete={Actions.removeItem({ selection })}
          canBeRemoved={selection.length > requiredItems}
          readOnly={readOnly}
        />
      ))}

      {showDropdown && (
        <Dropdown
          items={State.getItems(state)}
          itemKey={State.getItemKey(state)}
          itemLabel={State.getItemLabel(state)}
          onChange={Actions.onDropdownChange({ selection })}
          selection={null}
          autocompleteMinChars={autocompleteMinChars}
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

InputChips.propTypes = {
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string]),
}

InputChips.defaultProps = {
  items: [],
  itemLabel: 'value',
  itemKey: 'key',
  selection: [],
  requiredItems: 0,
  autocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  validation: {},
  onChange: null, // Callback to receive all selection change
  onItemAdd: null, // Callback to receive added item
  onItemRemove: null, // Callback to receive removed item
}

export default InputChips
