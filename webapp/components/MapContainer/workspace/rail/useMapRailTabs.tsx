import React, { useMemo } from 'react'

import type { MapRailTab, MapWorkspaceVariant } from '../mapWorkspaceTypes'
import { scenesRailTab } from '../scenes/scenesRailTab'
import { LayersPanel } from './LayersPanel'
import { LegendPanel } from './LegendPanel'

const NO_RAIL_TABS: MapRailTab[] = []

/**
 * Builds the rail tabs: Layers, the caller's tabs (e.g. Records), Sentinel-2, Legend. Compact maps have no rail.
 * @param {object} params - Parameters.
 * @param {MapWorkspaceVariant} params.variant - Workspace variant.
 * @param {MapRailTab[]} [params.extraRailTabs] - Tabs added by the page (memoised by the caller).
 * @param {number} params.dataLayersCount - Number of survey data layers.
 * @returns {MapRailTab[]} The tabs (empty for compact maps).
 */
export const useMapRailTabs = ({
  variant,
  extraRailTabs = NO_RAIL_TABS,
  dataLayersCount,
}: {
  variant: MapWorkspaceVariant
  extraRailTabs?: MapRailTab[]
  dataLayersCount: number
}): MapRailTab[] =>
  useMemo(() => {
    if (variant !== 'full') return NO_RAIL_TABS
    return [
      {
        key: 'layers',
        labelKey: 'mapWorkspace.rail.tabs.layers',
        iconClassName: 'icon-stack',
        content: <LayersPanel dataLayersCount={dataLayersCount} />,
      },
      ...extraRailTabs,
      scenesRailTab,
      {
        key: 'legend',
        labelKey: 'mapWorkspace.rail.tabs.legend',
        iconClassName: 'icon-info',
        content: <LegendPanel />,
      },
    ]
  }, [dataLayersCount, extraRailTabs, variant])
