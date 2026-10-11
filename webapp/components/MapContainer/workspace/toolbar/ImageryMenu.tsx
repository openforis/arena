import React from 'react'
import type { ReactElement } from 'react'

import { useMapPlanetPeriod } from '../imagery/MapPlanetPeriodContext'
import { PlanetPeriodSection } from '../imagery/PlanetPeriodSection'
import { MenuSectionHeader } from './menuItems'
import { ToolbarMenu } from './ToolbarMenu'

/**
 * Imagery menu (full bar): Planet periods of the base map. Hidden while the base map has no periods
 * (Part 4 adds Sentinel-2 and shows the menu always).
 * @returns {React.ReactElement|null} The menu.
 */
export const ImageryMenu = (): ReactElement | null => {
  const { available } = useMapPlanetPeriod()
  if (!available) return null
  return (
    <ToolbarMenu menuKey="imagery" labelKey="mapWorkspace.menus.imagery" iconClassName="icon-images">
      {() => [
        <MenuSectionHeader key="planetPeriodHeader" labelKey="mapWorkspace.imagery.planetPeriod" />,
        <PlanetPeriodSection key="planetPeriod" />,
      ]}
    </ToolbarMenu>
  )
}
