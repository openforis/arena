import { useEffect } from 'react'
import type L from 'leaflet'

import { mgrsTileBounds } from './mgrsTiles'
import { addSceneOutline, SCENE_FOOTPRINT_STYLE } from './sceneLeaflet'

/**
 * Shows a dashed outline of the selected scene's MGRS 100 km square.
 *
 * @param {L.Map} map - Map.
 * @param {string|null} tile - Tile of the selected scene, or null.
 * @returns {void}
 */
export const useSceneFootprint = (map: L.Map, tile: string | null): void => {
  useEffect(() => {
    const bounds = tile ? mgrsTileBounds(tile) : null
    if (!bounds) return undefined
    const outline = addSceneOutline(map, bounds, SCENE_FOOTPRINT_STYLE)
    return () => {
      outline.remove()
    }
  }, [map, tile])
}
