import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'

import { MenuActionItem } from './MenuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Tools menu (full bar). Starting a tool waits for the menu to close, so the focus is not taken back by the menu button.
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
          onClick={() => close(() => dispatch({ type: 'startTool', tool: 'measureDistance' }))}
        />,
        <MenuActionItem
          key="measureArea"
          itemKey="measureArea"
          labelKey="mapWorkspace.measure.measureArea"
          onClick={() => close(() => dispatch({ type: 'startTool', tool: 'measureArea' }))}
        />,
      ]}
    </ToolbarMenu>
  )
}
