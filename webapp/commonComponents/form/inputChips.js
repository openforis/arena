import './inputChips.scss'

import React from 'react'
import * as R from 'ramda'

import Dropdown from './dropdown'
import { TooltipError } from '../tooltip'

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

      <button className="btn-of-light-xs btn-s btn-remove"
              onClick={() => onDelete(item)}
              aria-disabled={!canBeRemoved}>
        <span className="icon icon-cross icon-8px"/>
      </button>

    </div>

  </div>
}

const InputChips = (props) => {

  const {
    items,
    itemKeyProp,
    itemKeyFunction,
    onChange,
    selection = [],
    requiredItems = 0,
    dropdownAutocompleteMinChars = 0,
    readOnly = false,
    validation = {}
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

  const dropdownItems = R.reject(item => R.contains(item, selection))(items)

  return <TooltipError messages={validation.errors}>
    <div className="form-input-chip">
      {
        selection.map((item) =>
          <Chip {...props}
                key={getItemKey(item, itemKeyFunction, itemKeyProp)}
                item={item}
                onDelete={removeItem}
                canBeRemoved={!readOnly && selection.length > requiredItems}
          />
        )
      }
      <Dropdown {...props}
                items={dropdownItems}
                onChange={onDropdownChange}
                selection={null}
                clearOnSelection={true}
                autocompleteMinChars={dropdownAutocompleteMinChars}
                readOnly={readOnly}/>
    </div>
  </TooltipError>
}

export default InputChips