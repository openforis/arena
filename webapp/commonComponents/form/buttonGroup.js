import React from 'react'

const ButtonGroup = ({ items, selectedItemKey, onChange, disabled }) => (
  <div>
    {
      items.map(item =>
        <button key={item.key}
                className={`btn btn-s${selectedItemKey === item.key ? ' active' : ''}`}
                onClick={() => onChange(item.key)}
                aria-disabled={!!item.disabled || disabled}>
          {item.label}
        </button>
      )
    }
  </div>
)

ButtonGroup.defaultProps = {
  items: [],
  selectedItemKey: null,
  onChange: () => {},
  disabled: false,
}

export default ButtonGroup