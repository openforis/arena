import React from 'react'
import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'
import { MAP_SHORTCUT_LABELS } from '../shortcuts/mapShortcuts'
import { MenuActionItem } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Tools menu (full bar). Starting a tool waits for the menu to close, so the focus is not taken back by the menu button.
 * @returns {React.ReactElement} The menu.
 */
export const ToolsMenu = (): ReactElement => {
  const { dispatch } = useMapWorkspace()
  return (
    <ToolbarMenu menuKey="tools" labelKey="mapWorkspace.menus.tools" iconClassName="icon-wrench">
      {(close) => [
        <MenuActionItem
          key="measureDistance"
          itemKey="measureDistance"
          labelKey="mapWorkspace.tools.measureDistance"
          shortcut={MAP_SHORTCUT_LABELS.measureDistance}
          onClick={() => close(() => dispatch({ type: 'startTool', tool: 'measureDistance' }))}
        />,
      ]}
    </ToolbarMenu>
  )
}
