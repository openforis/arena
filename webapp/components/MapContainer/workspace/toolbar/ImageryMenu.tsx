import React from 'react'
import type { ReactElement } from 'react'

import { useMapPlanetPeriod } from '../imagery/MapPlanetPeriodContext'
import { PlanetPeriodSection } from '../imagery/PlanetPeriodSection'
import { useMapWorkspace } from '../MapWorkspaceContext'
import { MenuActionItem, MenuSectionHeader } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Imagery menu (full bar): the Sentinel-2 scene search, then the Planet periods when the base map has them.
 * @returns {React.ReactElement} The menu.
 */
export const ImageryMenu = (): ReactElement => {
  const { available } = useMapPlanetPeriod()
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
        ...(available
          ? [
              <MenuSectionHeader key="planetPeriodHeader" labelKey="mapWorkspace.imagery.planetPeriod" />,
              <PlanetPeriodSection key="planetPeriod" />,
            ]
          : []),
      ]}
    </ToolbarMenu>
  )
}
