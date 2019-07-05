import React from 'react'

const ButtonGroup = ({ items, selectedItemKey, onChange }) => (
  <div>
    {
      items.map(item =>
        <button key={item.key}
                className={`btn${selectedItemKey === item.key ? ' active' : ''}`}
                onClick={() => onChange(item.key)}
                aria-disabled={!!item.disabled}>
          {item.label}
        </button>
      )
    }
  </div>
)

export default ButtonGroup