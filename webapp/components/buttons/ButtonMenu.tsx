import './ButtonMenu.scss'

import React, { useState } from 'react'
import classNames from 'classnames'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { Button, ButtonProps } from './Button'

export type ButtonMenuItem = {
  key: string
  className?: string
  content?: React.ReactNode
  icon?: React.ReactNode
  iconClassName?: string
  label?: string
  labelIsI18nKey?: boolean
  labelParams?: Record<string, unknown>
  onClick?: () => void
  testId?: string
}

type ButtonMenuProps = ButtonProps & {
  closeMenuOnItemClick?: boolean
  items: ButtonMenuItem[]
  menuClassName?: string
  onItemClick?: (item: ButtonMenuItem) => void
  selectedItemKey?: string
}

export const ButtonMenu = (props: ButtonMenuProps) => {
  const {
    className,
    closeMenuOnItemClick = true,
    menuClassName,
    items,
    onItemClick: onItemClickProp,
    selectedItemKey,
    testId = null,
    variant = 'text',
    ...otherProps
  } = props

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const onButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const onItemClick = (item: ButtonMenuItem) => () => {
    item.onClick?.()
    onItemClickProp?.(item)
    if (closeMenuOnItemClick) {
      closeMenu()
    }
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Button
        className={classNames('button-menu__button', className)}
        onClick={onButtonClick}
        testId={testId}
        variant={variant}
        {...otherProps}
      >
        <span className="icon icon-ctrl button-menu__button-icon" />
      </Button>

      <Menu anchorEl={anchorEl} className={menuClassName} open={open} onClose={closeMenu}>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            className="button-menu__item"
            onClick={onItemClick(item)}
            selected={item.key === selectedItemKey}
          >
            {item.content ?? (
              <Button
                className={classNames(item.className)}
                iconClassName={item.iconClassName}
                label={item.label}
                labelIsI18nKey={item.labelIsI18nKey}
                labelParams={item.labelParams}
                testId={item.testId}
                variant="text"
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
