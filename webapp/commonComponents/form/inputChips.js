import './inputChips.scss'

import React from 'react'
import * as R from 'ramda'

import Dropdown from './dropdown'

const extractValueFromFunctionOrProp = (item, func, prop, defaultProp) =>
  R.is(Object, item) ?
    func ?
      func(item)
      : prop ?
      R.prop(prop)(item)
      : R.has(defaultProp)(item) ?
        R.prop(defaultProp)(item)
        : item
    : item //primitive

const getItemLabel = (item, itemLabelFunction, itemLabelProp) =>
  extractValueFromFunctionOrProp(item, itemLabelFunction, itemLabelProp, 'value')

const getItemKey = (item, itemKeyFunction, itemKeyProp) =>
  extractValueFromFunctionOrProp(item, itemKeyFunction, itemKeyProp, 'key')

const Chip = props => {
  const {
    item,
    itemLabelFunction,
    itemLabelProp,
    onDelete,
    canBeRemoved,
  } = props

  return <div className="form-input">

    <div className="btn-of btn-s form-input-chip-item">
      {getItemLabel(item, itemLabelFunction, itemLabelProp)}

      {
        canBeRemoved ? (
          <button className="btn-of-light-xs btn-s btn-remove"
                  onClick={() => onDelete(item)}>
            <span className="icon icon-cross icon-8px"/>
          </button>
        ) : null
      }

    </div>

  </div>
}

const InputChips = (props) => {

  const {
    items,
    itemsLookupFunction,
    itemKeyProp,
    itemKeyFunction,
    itemLabelFunction,
    itemLabelProp,
    onChange,
    selection,
    requiredItems,
    dropdownAutocompleteMinChars,
    readOnly,
    disabled,
    validation,
  } = props

  const onDropdownChange = (item) => {
    if (item) {
      const newItems = R.append(item)(selection)
      onChange(newItems)
    }
  }

  const removeItem = (item) => {
    const idx = R.indexOf(item)(selection)
    const newItems = R.remove(idx, 1, selection)
    onChange(newItems)
  }

  const rejectSelectedItems = R.reject(item => R.contains(item, selection))

  const dropdownItems = rejectSelectedItems(items)

  const dropdownItemsLookupFunction = itemsLookupFunction ?
    async value => rejectSelectedItems(await itemsLookupFunction(value))
    : null

  return (
    <div className="form-input-chip">
      {
        selection.map((item) =>
          <Chip key={getItemKey(item, itemKeyFunction, itemKeyProp)}
                item={item}
                itemKeyProp={itemKeyProp}
                itemKeyFunction={itemKeyFunction}
                itemLabelFunction={itemLabelFunction}
                itemLabelProp={itemLabelProp}
                onDelete={removeItem}
                canBeRemoved={!readOnly && selection.length > requiredItems}
          />
        )
      }

      {
        !readOnly ? (
          <Dropdown items={dropdownItems}
                    itemsLookupFunction={dropdownItemsLookupFunction}
                    itemKeyProp={itemKeyProp}
                    itemKeyFunction={itemKeyFunction}
                    itemLabelFunction={itemLabelFunction}
                    itemLabelProp={itemLabelProp}
                    onChange={onDropdownChange}
                    selection={null}
                    clearOnSelection={true}
                    autocompleteMinChars={dropdownAutocompleteMinChars}
                    readOnly={readOnly}
                    disabled={disabled}
                    validation={validation}/>
        ) : null
      }
    </div>
  )
}

InputChips.defaultProps = {
  items: [],
  itemsLookupFunction: null, //async function to find items by specified value
  itemKeyProp: null,
  itemKeyFunction: null,
  itemLabelFunction: null,
  itemLabelProp: null,
  onChange: null,
  selection: [],
  requiredItems: 0,
  dropdownAutocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  validation: {}
}

export default InputChips