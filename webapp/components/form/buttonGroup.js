import './buttonGroup.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'
import { Button } from '../buttons'

const ButtonGroup = ({ items, groupName, multiple, selectedItemKey, onChange, disabled, deselectable, className }) => (
  <div className={`btn-group${className ? ` ${className}` : ''}`}>
    {items.map((item) => {
      const selected = selectedItemKey === item.key || (multiple && R.includes(item.key, selectedItemKey))
      return (
        <Button
          key={item.key}
          className={`btn-s${selected ? ' active' : ''}${deselectable ? ' deselectable' : ''}`}
          disabled={Boolean(item.disabled) || disabled}
          iconClassName={item.iconClassName}
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
          label={item.label}
          testId={groupName ? `${groupName}_${item.key}` : null}
        />
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
