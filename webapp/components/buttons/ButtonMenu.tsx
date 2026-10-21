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
  disabled?: boolean
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

type ButtonMenuPopupProps = {
  anchorEl: HTMLElement | null
  closeMenuOnItemClick?: boolean
  items: ButtonMenuItem[]
  menuClassName?: string
  onClose: () => void
  onItemClick?: (item: ButtonMenuItem) => void
  selectedItemKey?: string
}

/**
 * Menu with the items of a menu button, anchored to the given element.
 * @param {ButtonMenuPopupProps} props - The menu props.
 * @returns {React.ReactElement} - The menu element.
 */
export const ButtonMenuPopup = (props: ButtonMenuPopupProps) => {
  const {
    anchorEl,
    closeMenuOnItemClick = true,
    items,
    menuClassName,
    onClose,
    onItemClick: onItemClickProp,
    selectedItemKey,
  } = props

  const onItemClick = (item: ButtonMenuItem) => () => {
    item.onClick?.()
    onItemClickProp?.(item)
    if (closeMenuOnItemClick) {
      onClose()
    }
  }

  return (
    <Menu anchorEl={anchorEl} className={menuClassName} open={Boolean(anchorEl)} onClose={onClose}>
      {items.map((item) => (
        <MenuItem
          key={item.key}
          className="button-menu__item"
          disabled={item.disabled}
          onClick={onItemClick(item)}
          selected={item.key === selectedItemKey}
        >
          {item.content ?? (
            <Button
              className={classNames(item.className)}
              icon={item.icon}
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
  )
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

      <ButtonMenuPopup
        anchorEl={anchorEl}
        closeMenuOnItemClick={closeMenuOnItemClick}
        items={items}
        menuClassName={menuClassName}
        onClose={closeMenu}
        onItemClick={onItemClickProp}
        selectedItemKey={selectedItemKey}
      />
    </>
  )
}
