import React, { type ReactNode, useCallback } from 'react'

import { useMapCustomLayers } from '@webapp/components/MapContainer/workspace/customLayers/MapCustomLayersContext'
import { useMapBaseLayerApi } from '@webapp/components/MapContainer/workspace/customLayers/useMapBaseLayerApi'
import {
  MenuActionItem,
  MenuRadioItem,
  MenuSectionHeader,
} from '@webapp/components/MapContainer/workspace/toolbar/menuItems'

type CloseMenu = (afterClose?: () => void) => void

/**
 * Builds the "Custom (WMS / WMTS)" section of the Base map menu: one radio per custom base map, and a remove action
 * for the selected one. Custom base maps are only listed here; they are added from Add data (spec §2).
 * @returns {Function} Given the menu close function, the menu items (empty without custom base maps).
 */
export const useCustomBaseMapMenuItems = (): ((close: CloseMenu) => ReactNode[]) => {
  const { baseMaps, removeLayer } = useMapCustomLayers()
  const { selectedBaseLayerKey, selectBaseLayer } = useMapBaseLayerApi()

  return useCallback(
    (close: CloseMenu): ReactNode[] => {
      if (baseMaps.length === 0) return []
      const selected = baseMaps.find((def) => def.key === selectedBaseLayerKey)
      const items: ReactNode[] = [<MenuSectionHeader key="customHeader" labelKey="mapWorkspace.layers.groups.custom" />]
      for (const def of baseMaps) {
        items.push(
          <MenuRadioItem
            key={def.key}
            itemKey={`baseMap-${def.key}`}
            label={def.label}
            checked={def === selected}
            onSelect={() => {
              selectBaseLayer(def)
              close()
            }}
          />
        )
      }
      if (selected) {
        items.push(
          <MenuActionItem
            key="removeCustomBaseMap"
            itemKey="removeCustomBaseMap"
            labelKey="mapWorkspace.wms.removeSelectedBaseMap"
            onClick={() => {
              close()
              void removeLayer(selected.custom)
            }}
          />
        )
      }
      return items
    },
    [baseMaps, removeLayer, selectBaseLayer, selectedBaseLayerKey]
  )
}
