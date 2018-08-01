import React from 'react'
import * as R from 'ramda'

import DropdownComponent from './dropdownComponent'

const margin = '0 .3rem'

const Chip = ({item, onDelete, idx, canBeRemoved}) => (
  <div className="btn-of btn-s"
       style={{
         display: 'grid',
         gridTemplateColumns: '1fr 30px',
         alignItems: 'center',
         gridColumnGap: '.3rem',
         margin,
         fontWeight: idx === 0 ? '600' : 'inherit'
       }}>
    {item.value}
    <button className="btn-of-light-s btn-s"
            onClick={e => onDelete(item)}
            aria-disabled={!canBeRemoved}>
      <span className="icon icon-cross icon-8px"/>
    </button>
  </div>
)

const FormInputChipsComponent = ({items, selection, onChange, requiredItems = 0}) => {

  const addItem = (item) => {
    const newItems = R.append(item)(selection)
    onChange(newItems)
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
    <DropdownComponent items={dropdownItems}
                       onChange={item => addItem(item)}
                       selection={null}
                       clearOnSelection={true}
                       style={{margin}}/>
  </div>
}

export default FormInputChipsComponent