import './buttonGroup.scss'

import React from 'react'
import classNames from 'classnames'
import * as R from 'ramda'
import PropTypes from 'prop-types'
import MuiButtonGroup from '@mui/material/ButtonGroup'

import { Button } from '../buttons'

const ButtonGroup = ({ items, groupName, multiple, selectedItemKey, onChange, disabled, deselectable, className }) => {
  const onItemClick =
    ({ item, selected }) =>
    () => {
      if (selected && !multiple && !deselectable) return
      let value
      if (multiple) {
        value = R.ifElse(R.always(selected), R.without(item.key), R.append(item.key))(selectedItemKey)
      } else if (!selected) {
        value = item.key
      } else {
        value = null
      }
      onChange(value)
    }

  return (
    <MuiButtonGroup className={classNames('btn-group', className)}>
      {items.map((item) => {
        const selected = selectedItemKey === item.key || (multiple && R.includes(item.key, selectedItemKey))
        const variant = selected ? 'contained' : 'outlined'
        return (
          <Button
            key={item.key}
            className={`btn-s${deselectable ? ' deselectable' : ''}`}
            disabled={Boolean(item.disabled) || disabled}
            iconClassName={item.iconClassName}
            onClick={onItemClick({ item, selected })}
            label={item.label}
            title={item.title}
            testId={groupName ? `${groupName}_${item.key}` : null}
            variant={variant}
          />
        )
      })}
    </MuiButtonGroup>
  )
}

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
