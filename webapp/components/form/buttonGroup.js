import './buttonGroup.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

const ButtonGroup = ({ items, groupName, multiple, selectedItemKey, onChange, disabled, deselectable, className }) => (
  <div className={`btn-group${className ? ` ${className}` : ''}`}>
    {items.map((item) => {
      const selected = selectedItemKey === item.key || (multiple && R.includes(item.key, selectedItemKey))
      return (
        <button
          data-testid={groupName ? `${groupName}_${item.key}` : null}
          key={item.key}
          type="button"
          className={`btn btn-s${selected ? ' active' : ''}${deselectable ? ' deselectable' : ''}`}
          onClick={() => {
            let value
            if (multiple) {
              value = R.ifElse(R.always(selected), R.without(item.key), R.append(item.key))(selectedItemKey)
            } else if (selected) {
              value = null
            } else {
              value = item.key
            }
            onChange(value)
          }}
          aria-disabled={Boolean(item.disabled) || disabled}
        >
          {item.label}
        </button>
      )
    })}
  </div>
)

ButtonGroup.propTypes = {
  items: PropTypes.array,
  groupName: PropTypes.string,
  selectedItemKey: PropTypes.any, // Array of values if multiple=true
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  deselectable: PropTypes.bool,
  className: PropTypes.string,
}

ButtonGroup.defaultProps = {
  items: [],
  groupName: null,
  selectedItemKey: null,
  onChange: () => {},
  disabled: false,
  multiple: false,
  deselectable: false,
  className: null,
}

export default ButtonGroup
