import './buttonGroup.scss'

import React from 'react'
import classNames from 'classnames'
import * as R from 'ramda'
import PropTypes from 'prop-types'
import MuiButtonGroup from '@mui/material/ButtonGroup'

import { Button } from '../buttons'

const ButtonGroup = ({
  className = null,
  deselectable = false,
  disabled = false,
  groupName = null,
  items = [],
  multiple = false,
  onChange = () => {},
  selectedItemKey = null,
}) => {
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
        const { key, disabled: itemDisabled, icon, iconClassName, label, labelParams, title } = item
        const selected = selectedItemKey === key || (multiple && R.includes(key, selectedItemKey))
        const variant = selected ? 'contained' : 'outlined'
        return (
          <Button
            key={key}
            className={`btn-s${deselectable ? ' deselectable' : ''}`}
            disabled={Boolean(itemDisabled) || disabled}
            icon={icon}
            iconClassName={iconClassName}
            onClick={onItemClick({ item, selected })}
            label={label}
            labelParams={labelParams}
            title={title}
            testId={groupName ? `${groupName}_${key}` : null}
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

export default ButtonGroup
