import React from 'react'
import * as R from 'ramda'
import DropdownComponent from './dropdownComponent'

const Chip = ({item, onDelete}) => {
  return <span style={{
    border: '2px solid white',
    borderRadius: '15px',
    padding: '6px 12px',
  }}>
    {item.value}
    <button onClick={e => onDelete(item)}>
      <span className="icon icon-cross icon-12px"/>
    </button>
  </span>
}

const FormInputChipsComponent = ({items, selection, onChange}) => {

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

  return <div>
    {selection.map(item => <Chip key={item.key} item={item} onDelete={item => removeItem(item)}/>)}
    <DropdownComponent items={dropdownItems}
                       onChange={item => addItem(item)}
                       selection={null}
                       clearOnSelection={true} />
  </div>
}

export default FormInputChipsComponent