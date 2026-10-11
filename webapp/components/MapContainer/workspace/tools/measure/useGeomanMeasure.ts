import { useEffect, useState } from 'react'
import type { Dispatch, RefObject } from 'react'
import type L from 'leaflet'

import {
  finishMeasureDraw,
  startMeasureDraw,
  stopMeasureDraw,
} from '@webapp/components/MapContainer/workspace/tools/measure/geomanMeasure'
import { interceptDoubleClick } from '@webapp/components/MapContainer/workspace/tools/measure/measureDoubleClick'
import { toLatLngPairs } from '@webapp/components/MapContainer/workspace/tools/measure/measureGeometry'
import { geomanShapeOf, measureDrawOptions } from '@webapp/components/MapContainer/workspace/tools/measure/measureModes'
import { canFinishMeasure } from '@webapp/components/MapContainer/workspace/tools/measure/measureState'
import type { MeasureAction, MeasureMode } from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

export type UseGeomanMeasureParams = {
  map: L.Map
  mode: MeasureMode
  dispatch: Dispatch<MeasureAction>
  barRef: RefObject<HTMLElement | null>
}

/**
 * Draws measurements with Geoman and reports them to the measure reducer; a mode change restarts drawing.
 * @param {UseGeomanMeasureParams} params - The map, the mode, the reducer dispatch and the measure bar element.
 * @returns {L.Polyline|null} The last finished shape (polyline or polygon), until the next measurement starts.
 */
export const useGeomanMeasure = ({ map, mode, dispatch, barRef }: UseGeomanMeasureParams): L.Polyline | null => {
  const [finishedLayer, setFinishedLayer] = useState<L.Polyline | null>(null)

  /**
   * Starts drawing for the mode and wires the Geoman events; the cleanup undoes everything.
   * @returns {() => void} The cleanup.
   */
  useEffect(() => {
    const shape = geomanShapeOf(mode)
    let workingLayer: L.Polyline | null = null
    let finished: L.Polyline | null = null

    /**
     * Removes the finished shape from the map.
     * @returns {void}
     */
    const clearFinished = (): void => {
      if (!finished) return
      finished.remove()
      finished = null
      setFinishedLayer(null)
    }

    /**
     * Reports the vertices and the rubber-band end of the shape being drawn.
     * @param {object} event - Geoman pm:change event.
     * @returns {void}
     */
    const onChange: L.PM.ChangeEventHandler = (event) => {
      const vertices = toLatLngPairs(workingLayer?.getLatLngs())
      // the first vertex of a new measurement replaces the finished one
      if (vertices.length > 0) clearFinished()
      dispatch({ type: 'change', vertices, latLngs: toLatLngPairs(event.latlngs) })
    }

    /**
     * Follows the new working layer Geoman creates for every drawing.
     * @param {object} event - Geoman pm:drawstart event.
     * @returns {void}
     */
    const onDrawStart: L.PM.DrawStartEventHandler = (event) => {
      workingLayer?.off('pm:change', onChange)
      workingLayer = event.workingLayer as L.Polyline
      workingLayer.on('pm:change', onChange)
    }

    /**
     * Keeps the finished shape on the map with a label and reports it.
     * @param {object} event - Geoman pm:create event.
     * @returns {void}
     */
    const onCreate: L.PM.CreateEventHandler = (event) => {
      clearFinished()
      finished = event.layer as L.Polyline
      // content set by MeasureTool, in the chosen unit
      finished.bindTooltip('', { permanent: true, direction: 'center' })
      setFinishedLayer(finished)
      dispatch({ type: 'finish', vertices: toLatLngPairs(finished.getLatLngs()) })
    }

    /**
     * Finishes the shape being drawn when it has enough vertices (otherwise keeps drawing).
     * @returns {boolean} True when the shape was finished.
     */
    const finishIfComplete = (): boolean => {
      const vertexCount = toLatLngPairs(workingLayer?.getLatLngs()).length
      if (!canFinishMeasure(mode, vertexCount)) return false
      finishMeasureDraw(map, shape)
      return true
    }

    /**
     * Finishes the shape on double-click (not on the bar).
     * @param {Event} event - The captured double-click.
     * @returns {void}
     */
    const onDoubleClick = (event: Event): void => {
      if (!barRef.current?.contains(event.target as Node)) finishIfComplete()
    }

    /**
     * Finishes the shape on Enter pressed on the map container itself (not on controls or popups inside it).
     * @param {KeyboardEvent} event - The key event.
     * @returns {void}
     */
    const onKeyDown = (event: KeyboardEvent): void => {
      // this native listener runs before React's onKeyDown handlers: defaultPrevented only reflects earlier native
      // listeners, it cannot see a React preventDefault
      if (event.key !== 'Enter' || event.defaultPrevented || event.target !== container) return
      if (finishIfComplete()) event.preventDefault()
    }

    const container = map.getContainer()
    map.on('pm:drawstart', onDrawStart)
    map.on('pm:create', onCreate)
    const releaseDoubleClick = interceptDoubleClick(container, onDoubleClick)
    container.addEventListener('keydown', onKeyDown)
    startMeasureDraw(map, shape, measureDrawOptions(mode))

    /**
     * Stops drawing, removes the listeners and the finished shape, and resets the measure state.
     * @returns {void}
     */
    return () => {
      releaseDoubleClick()
      container.removeEventListener('keydown', onKeyDown)
      map.off('pm:drawstart', onDrawStart)
      map.off('pm:create', onCreate)
      workingLayer?.off('pm:change', onChange)
      stopMeasureDraw(map)
      clearFinished()
      dispatch({ type: 'reset' })
    }
  }, [barRef, dispatch, map, mode])

  return finishedLayer
}
