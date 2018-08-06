import React from 'react'
import * as R from 'ramda'

import Dropdown from './dropdown'

const Chip = ({item, onDelete, idx, canBeRemoved}) => (
  <div className="form-input"
       style={{
         padding: '0',
       }}>
    <div className="btn-of btn-s"
         style={{
           display: 'grid',
           gridTemplateColumns: '1fr 30px',
           alignItems: 'center',
           gridColumnGap: '.3rem',
           fontWeight: idx === 0 ? '600' : 'inherit',
           margin: '.25rem .3rem',
           fontSize: '.7rem',
           padding: '.25rem .5rem'
         }}>
      {item.value}
      <button className="btn-of-light-xs btn-s"
              onClick={() => onDelete(item)}
              aria-disabled={!canBeRemoved}
              style={{padding: '.2rem .5rem'}}>
        <span className="icon icon-cross icon-8px"/>
      </button>
    </div>
  </div>
)

const InputChips = ({items, selection, onChange, requiredItems = 0, dropdownAutocompleteMinChars = 0}) => {

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

  return <div style={{
    display: 'flex',
    flexWrap: 'wrap',
  }}>
    {
      selection.map((item, i) =>
        <Chip key={item.key}
              item={item}
              onDelete={item => removeItem(item)}
              idx={i}
              canBeRemoved={selection.length > requiredItems}/>
      )
    }
    <Dropdown items={dropdownItems}
              onChange={onDropdownChange}
              selection={null}
              clearOnSelection={true}
              autocompleteMinChars={dropdownAutocompleteMinChars} />
  </div>
}

export default InputChips