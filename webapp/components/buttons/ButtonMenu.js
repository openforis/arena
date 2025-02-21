import './ButtonMenu.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { Button } from './Button'

export const ButtonMenu = (props) => {
  const {
    className,
    closeMenuOnItemClick = true,
    menuClassName,
    items,
    testId = null,
    variant = 'text',
    ...otherProps
  } = props

  const [anchorEl, setAnchorEl] = useState(null)

  const onButtonClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  const onItemClick = (item) => () => {
    item.onClick?.()
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
        {/* show small arrow down icon on the right */}
        <span className="icon icon-ctrl button-menu__button-icon" />
      </Button>

      <Menu anchorEl={anchorEl} className={menuClassName} open={open} onClose={closeMenu}>
        {items.map((item) => (
          <MenuItem key={item.key} className="button-menu__item" onClick={onItemClick(item)}>
            {item.content ?? (
              <Button
                className={classNames(item.className)}
                testId={item.testId}
                iconClassName={item.iconClassName}
                label={item.label}
                variant="text"
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

ButtonMenu.propTypes = {
  ...Button.propTypes,
  closeMenuOnItemClick: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      content: PropTypes.node,
      icon: PropTypes.node,
      iconClassName: PropTypes.string,
      label: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  menuClassName: PropTypes.string,
}
