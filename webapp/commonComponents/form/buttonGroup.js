import React from 'react'

import * as R from 'ramda'

const ButtonGroup = ({ items, multiple, selectedItemKey, onChange, disabled, deselectable }) => (
  <div>
    {items.map(item => {
      const selected = selectedItemKey === item.key || (multiple && R.includes(item.key, selectedItemKey))
      return (
        <button
          key={item.key}
          type="button"
          className={`btn btn-s${selected ? ' active' : ''}${deselectable ? ' deselectable' : ''}`}
          onClick={() =>
            onChange(
              multiple
                ? R.ifElse(R.always(selected), R.without(item.key), R.append(item.key))(selectedItemKey)
                : item.key,
            )
          }
          aria-disabled={Boolean(item.disabled) || disabled}
        >
          {item.label}
        </button>
      )
    })}
  </div>
)

ButtonGroup.defaultProps = {
  items: [],
  selectedItemKey: null, // Array of values if multiple=true
  onChange: () => {},
  disabled: false,
  multiple: false,
  deselectable: false,
}

export default ButtonGroup
