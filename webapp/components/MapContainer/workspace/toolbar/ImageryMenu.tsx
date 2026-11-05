import React from 'react'
import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'
import { MenuActionItem } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Imagery menu (full bar): the Sentinel-2 scene search.
 * @returns {React.ReactElement} The menu.
 */
export const ImageryMenu = (): ReactElement => {
  const { dispatch } = useMapWorkspace()
  return (
    <ToolbarMenu menuKey="imagery" labelKey="mapWorkspace.menus.imagery" iconClassName="icon-images">
      {(close) => [
        <MenuActionItem
          key="searchScenes"
          itemKey="searchScenes"
          labelKey="mapWorkspace.scenes.menuSearch"
          onClick={() => close(() => dispatch({ type: 'openRailTab', tab: 'scenes' }))}
        />,
      ]}
    </ToolbarMenu>
  )
}
