import './MenuButton.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Menu from '@mui/material/Menu'
import { MenuItem } from '@mui/material'

import { useI18n } from '@webapp/store/system'

import { Button } from './Button'

export const MenuButton = (props) => {
  const { buttonClassName, iconClassName, items, label } = props

  const i18n = useI18n()

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
      <Button
        className={classNames('menu-button__button', buttonClassName)}
        iconClassName={iconClassName}
        label={label}
        onClick={onButtonClick}
      >
        {/* show small arrow down icon on the right */}
        <span className="icon icon-ctrl menu-button__button-icon" />
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        {items.map((item) => (
          <MenuItem key={item.key} onClick={onItemClick(item)}>
            {item.content ? (
              item.content
            ) : (
              <>
                {item.icon} {i18n.t(item.label)}
              </>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

MenuButton.propTypes = {
  buttonClassName: PropTypes.string,
  iconClassName: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      content: PropTypes.node,
      icon: PropTypes.node,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    })
  ),
  label: PropTypes.string.isRequired,
}
