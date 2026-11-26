import type { ReactElement } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'

import { MenuActionItem } from './MenuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Imagery menu (full bar): the Sentinel-2 scene search.
 */
export const ImageryMenu = (): ReactElement => {
  const { dispatch } = useMapWorkspace()
  return (
    <ToolbarMenu menuKey="imagery" labelKey="mapWorkspace.menus.imagery" iconName="images">
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
