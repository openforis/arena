import './inputChips.scss'

import React from 'react'
import * as R from 'ramda'

import Dropdown from './dropdown'
import { TooltipError } from '../tooltip'

const Chip = ({item, onDelete, canBeRemoved}) => (
  <div className="form-input">

    <div className="btn-of btn-s form-input-chip-item">
      {item.value}

      <button className="btn-of-light-xs btn-s btn-remove"
              onClick={() => onDelete(item)}
              aria-disabled={!canBeRemoved}>
        <span className="icon icon-cross icon-8px"/>
      </button>

    </div>

  </div>
)

const InputChips = (props) => {

  const {
    items,
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
        selection.map((item, i) =>
          <Chip key={item.key}
                item={item}
                onDelete={item => removeItem(item)}
                canBeRemoved={!readOnly && selection.length > requiredItems}/>
        )
      }
      <Dropdown items={dropdownItems}
                onChange={onDropdownChange}
                selection={null}
                clearOnSelection={true}
                autocompleteMinChars={dropdownAutocompleteMinChars}
                readOnly={readOnly}/>
    </div>
  </TooltipError>
}

export default InputChips