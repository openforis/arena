import { useCallback, useMemo, useState } from 'react'
import type L from 'leaflet'

import { boundsAroundPoint } from './sceneLayerInfo'
import type { GeoBounds, SceneAreaKey } from './sceneTypes'
import { useDrawArea } from './useDrawArea'
import { useMapViewBounds } from './useMapViewBounds'
import { useSelectedPlotLocation } from './useSelectedPlotLocation'

export type SceneAreaState = {
  areaKey: SceneAreaKey
  selectArea: (key: SceneAreaKey) => void
  bounds: GeoBounds | null
  plotAvailable: boolean
  drawing: boolean
  hasDrawnArea: boolean
  startDrawing: () => void
}

/**
 * Holds the chosen search area (map view, selected plot or drawn rectangle) and its bounds.
 *
 * @param {L.Map} map - Map.
 * @param {boolean} active - Whether the panel is visible.
 * @returns {SceneAreaState} Area state.
 */
export const useSceneArea = (map: L.Map, active: boolean): SceneAreaState => {
  const [areaKey, setAreaKey] = useState<SceneAreaKey>('view')
  const viewBounds = useMapViewBounds(map)
  const plotLocation = useSelectedPlotLocation(map)
  const { bounds: drawnBounds, drawing, startDrawing, cancelDrawing } = useDrawArea(map, active && areaKey === 'draw')

  const plotBounds = useMemo(
    () => (plotLocation ? boundsAroundPoint(plotLocation.lat, plotLocation.lng) : null),
    [plotLocation]
  )

  const selectArea = useCallback(
    (key: SceneAreaKey): void => {
      setAreaKey(key)
      // choosing "Draw area" starts drawing only the first time; "Draw again" redraws
      if (key !== 'draw') cancelDrawing()
      else if (!drawnBounds) startDrawing()
    },
    [cancelDrawing, drawnBounds, startDrawing]
  )

  const boundsByArea: Record<SceneAreaKey, GeoBounds | null> = { view: viewBounds, plot: plotBounds, draw: drawnBounds }

  return {
    areaKey,
    selectArea,
    bounds: boundsByArea[areaKey],
    plotAvailable: plotLocation !== null,
    drawing,
    hasDrawnArea: drawnBounds !== null,
    startDrawing,
  }
}
