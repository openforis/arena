import { useCallback, useEffect, useState } from 'react'
import type L from 'leaflet'

import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { ensureGeoman } from '@webapp/components/MapContainer/workspace/tools/measure/geomanMeasure'

import { addSceneOutline, SCENE_DRAWN_AREA_STYLE, toGeoBounds } from './sceneLeaflet'
import type { GeoBounds } from './sceneTypes'

type GeomanCreateEvent = { shape: string; layer: L.Layer }

export type DrawAreaState = {
  bounds: GeoBounds | null
  drawing: boolean
  startDrawing: () => void
  cancelDrawing: () => void
}

/**
 * Lets the user draw the search rectangle with Geoman and keeps it as a dotted outline.
 *
 * @param {L.Map} map - Map.
 * @param {boolean} active - Whether the drawn area is the search area of the visible panel.
 * @returns {DrawAreaState} Drawn bounds, drawing flag and actions.
 */
export const useDrawArea = (map: L.Map, active: boolean): DrawAreaState => {
  const { dispatch, activeTool } = useMapWorkspace()
  const [bounds, setBounds] = useState<GeoBounds | null>(null)
  const [drawing, setDrawing] = useState(false)

  const startDrawing = useCallback((): void => {
    // the measure tools draw with Geoman too: end them so only one draw mode runs
    dispatch({ type: 'endTool' })
    setDrawing(true)
  }, [dispatch])

  const cancelDrawing = useCallback((): void => setDrawing(false), [])

  useEffect(() => {
    // closing the tab mid-drawing pauses it; reopening the tab resumes it, unless a measure tool has since
    // started: two Geoman draw modes must not run at once
    if (!drawing || !active || activeTool !== null) return undefined
    /**
     * Replaces Geoman's rectangle with the panel's own outline.
     *
     * @param {GeomanCreateEvent} event - Geoman pm:create event.
     * @returns {void}
     */
    const onCreate = (event: GeomanCreateEvent): void => {
      if (event.shape !== 'Rectangle') return
      const rectangle = event.layer as L.Rectangle
      rectangle.remove()
      setBounds(toGeoBounds(rectangle.getBounds()))
      setDrawing(false)
    }
    /**
     * Ends the drawing state when Geoman stops drawing (finished or replaced by another draw mode).
     *
     * @returns {void}
     */
    const onDrawEnd = (): void => setDrawing(false)

    ensureGeoman(map).enableDraw('Rectangle', {
      continueDrawing: false,
      tooltips: false, // Geoman's tooltips are English only; the panel message explains the clicks
      pathOptions: SCENE_DRAWN_AREA_STYLE,
    })
    // listen after enabling: enabling first ends any other draw mode, which fires pm:drawend
    map.on('pm:create', onCreate)
    map.on('pm:drawend', onDrawEnd)
    return () => {
      map.off('pm:create', onCreate)
      map.off('pm:drawend', onDrawEnd)
      if (map.pm?.Draw.getActiveShape() === 'Rectangle') map.pm.disableDraw('Rectangle')
    }
  }, [active, activeTool, drawing, map])

  useEffect(() => {
    if (!active || !bounds) return undefined
    const outline = addSceneOutline(map, bounds, SCENE_DRAWN_AREA_STYLE)
    return () => {
      outline.remove()
    }
  }, [active, bounds, map])

  return { bounds, drawing, startDrawing, cancelDrawing }
}
