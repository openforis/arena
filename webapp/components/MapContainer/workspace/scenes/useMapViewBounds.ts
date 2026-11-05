import { useEffect, useState } from 'react'
import type L from 'leaflet'

import { readViewBounds } from './sceneLeaflet'
import type { GeoBounds } from './sceneTypes'

// Panning fires many moveend events; search only once the view settles.
const VIEW_BOUNDS_DEBOUNCE_MS = 800

/**
 * Returns the bounds of the map view, updated 800 ms after the view stops moving.
 *
 * @param {L.Map} map - Map.
 * @returns {GeoBounds|null} View bounds.
 */
export const useMapViewBounds = (map: L.Map): GeoBounds | null => {
  const [bounds, setBounds] = useState<GeoBounds | null>(() => readViewBounds(map))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    /**
     * Restarts the debounce timer.
     *
     * @returns {void}
     */
    const onMoveEnd = (): void => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setBounds(readViewBounds(map)), VIEW_BOUNDS_DEBOUNCE_MS)
    }
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('moveend', onMoveEnd)
      if (timer) clearTimeout(timer)
    }
  }, [map])

  return bounds
}
