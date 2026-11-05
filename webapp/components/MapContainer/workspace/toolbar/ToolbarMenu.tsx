import { useCallback, useId, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Button, Menu } from '@mui/material'
import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useMapWorkspace } from '../MapWorkspaceContext'

type ToolbarMenuProps = {
  menuKey: string
  labelKey: string
  iconClassName: string
  children: (close: (afterClose?: () => void) => void) => ReactNode[]
}

/**
 * Top bar menu: a button that opens a MUI menu rendered inside the workspace (visible in full screen).
 * @param {object} props - Component props.
 * @param {string} props.menuKey - Menu key (test id suffix).
 * @param {string} props.labelKey - I18n key of the button label.
 * @param {string} props.iconClassName - Icon class of the button.
 * @param {Function} props.children - (close) => menu items; close(afterClose) runs afterClose once the menu is gone.
 * @returns {React.ReactElement} The menu button and its menu.
 */
export const ToolbarMenu = ({ menuKey, labelKey, iconClassName, children }: ToolbarMenuProps): ReactElement => {
  const t = useI18nT()
  const { portalContainer } = useMapWorkspace()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [afterClose, setAfterClose] = useState<(() => void) | null>(null)
  const menuId = useId()
  const open = anchorEl !== null
  const label = t(labelKey)

  /**
   * Closes the menu and optionally runs a callback once it has closed.
   * @param {Function} [callback] - Runs after the menu is closed.
   * @returns {void}
   */
  const close = useCallback((callback?: () => void) => {
    setAfterClose(callback ? () => callback : null) // wrapped: a state setter would call the function
    setAnchorEl(null)
  }, [])

  /**
   * Runs the pending callback after MUI gives the focus back to the menu button, so a focused input or dialog keeps it.
   * @returns {void}
   */
  const onExited = useCallback(() => {
    setAfterClose(null)
    afterClose?.()
  }, [afterClose])

  return (
    <>
      <Button
        className={classNames('map-toolbar__menu-button', { 'map-toolbar__menu-button--open': open })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-testid={TestId.mapWorkspace.menuButton(menuKey)}
        startIcon={<span className={`icon icon-14px ${iconClassName}`} aria-hidden="true" />}
        endIcon={
          <span className="map-toolbar__menu-button__caret" aria-hidden="true">
            ▾
          </span>
        }
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => close()}
        container={portalContainer}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ transition: { onExited }, list: { dense: true, 'aria-label': label } }}
      >
        {children(close)}
      </Menu>
    </>
  )
}
