import './ButtonMenu.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import { Button } from './Button'

export const ButtonMenu = (props) => {
  const { className, items, ...otherProps } = props

  const [anchorEl, setAnchorEl] = useState(null)

  const onButtonClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const onClose = () => {
    setAnchorEl(null)
  }

  const onItemClick = (item) => () => {
    item.onClick?.()
    onClose()
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Button {...otherProps} className={classNames('button-menu__button', className)} onClick={onButtonClick}>
        {/* show small arrow down icon on the right */}
        <span className="icon icon-ctrl button-menu__button-icon" />
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        {items.map((item) => (
          <MenuItem key={item.key} onClick={onItemClick(item)}>
            {item.content ? (
              item.content
            ) : (
              <Button
                className={classNames('btn-transparent', item.className)}
                testId={item.testId}
                iconClassName={item.iconClassName}
                label={item.label}
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
}

ButtonMenu.defaultProps = {
  ...Button.defaultProps,
}
