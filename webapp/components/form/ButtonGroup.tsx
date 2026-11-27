import './ButtonGroup.scss'

import MuiButtonGroup from '@mui/material/ButtonGroup'
import classNames from 'classnames'

import * as A from '@core/arena'
import { Button } from '../buttons'

type ButtonGroupProps = {
  items?: any[]
  groupName?: string
  selectedItemKey?: any // Array of values if multiple=true
  onChange?: (...args: any[]) => any
  disabled?: boolean
  multiple?: boolean
  deselectable?: boolean
  className?: string
}

const ButtonGroup = ({
  className = null,
  deselectable = false,
  disabled = false,
  groupName = null,
  items = [],
  multiple = false,
  onChange = (_value) => {},
  selectedItemKey = null,
}: ButtonGroupProps) => {
  const onItemClick =
    ({ item, selected }) =>
    () => {
      if (selected && !multiple && !deselectable) return
      let value
      if (multiple) {
        value = A.ifElse(A.always(selected), A.without([item.key]), A.append(item.key))(selectedItemKey)
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
        const { key, disabled: itemDisabled, icon, iconName, iconSize, label, labelParams, title } = item
        const selected = selectedItemKey === key || (multiple && A.includes(key, selectedItemKey))
        const variant = selected ? 'contained' : 'outlined'
        return (
          <Button
            key={key}
            className={`btn-s${deselectable ? ' deselectable' : ''}`}
            disabled={Boolean(itemDisabled) || disabled}
            icon={icon}
            iconName={iconName}
            iconSize={iconSize}
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

export const toButtonGroupItems = ({ i18n, object, labelPrefix, icon = null }) =>
  Object.keys(object).map((key) => ({
    key,
    label: i18n.t(`${labelPrefix}${key}`),
    icon: typeof icon === 'function' ? icon({ key }) : icon || null,
  }))

export default ButtonGroup
