import './buttonGroup.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

const ButtonGroup = ({
  items,
  groupName,
  multiple,
  selectedItemKey,
  onChange,
  disabled: disabledProp,
  deselectable,
  className,
}) => (
  <div className={`btn-group${className ? ` ${className}` : ''}`}>
    {items.map((item) => {
      const { key, disabled, icon, label } = item
      const selected = selectedItemKey === key || (multiple && R.includes(key, selectedItemKey))
      return (
        <button
          data-testid={groupName ? `${groupName}_${key}` : null}
          key={key}
          type="button"
          className={`btn btn-s${selected ? ' active' : ''}${deselectable ? ' deselectable' : ''}`}
          onClick={() => {
            let value
            if (multiple) {
              value = R.ifElse(R.always(selected), R.without(key), R.append(key))(selectedItemKey)
            } else if (selected) {
              value = null
            } else {
              value = key
            }
            onChange(value)
          }}
          aria-disabled={Boolean(disabled) || disabledProp}
        >
          {icon && icon({ key })}
          {label}
        </button>
      )
    })}
  </div>
)

export const toButtonGroupItems = ({ i18n, object, labelPrefix, icon = null }) =>
  Object.keys(object).map((key) => ({
    key,
    label: i18n.t(`${labelPrefix}${key}`),
    icon,
  }))

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
