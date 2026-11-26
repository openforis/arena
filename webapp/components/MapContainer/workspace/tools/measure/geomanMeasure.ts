// loads leaflet and Geoman, which patches the global L
import './leafletGeoman'

import L from 'leaflet'

import type {
  GeomanShape,
  MeasureDrawOptions,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

// Opt-in: only maps and layers with pmIgnore: false get Geoman. Otherwise every map of the app would get Geoman
// handlers and a document key listener, and every data marker an edit handler.
L.PM.setOptIn(true)

type GeomanDrawInstance = { _finishShape?: () => void }

/**
 * Enables Geoman on the map the first time a measurement starts on it.
 * @param {L.Map} map - The Leaflet map.
 * @returns {L.PM.PMMap} The Geoman handle of the map.
 */
export const ensureGeoman = (map: L.Map): L.PM.PMMap => {
  if (!map.pm) {
    map.options.pmIgnore = false
    L.PM.reInitLayer(map as unknown as L.Layer)
    // Geoman's key listener is on document (any Enter / Escape on the page): Escape is the workspace shortcut
    // (it ends the tool) and useGeomanMeasure finishes on Enter pressed on this map only
    map.pm.setGlobalOptions({ snappable: false, exitModeOnEscape: false, finishOnEnter: false })
  }
  return map.pm
}

/**
 * Starts drawing a measurement shape; Geoman's own toolbar is never added, the measure bar replaces it.
 * @param {L.Map} map - The Leaflet map.
 * @param {GeomanShape} shape - 'Line' or 'Polygon'.
 * @param {MeasureDrawOptions} options - The draw options.
 */
export const startMeasureDraw = (map: L.Map, shape: GeomanShape, options: MeasureDrawOptions): void => {
  ensureGeoman(map).enableDraw(shape, options)
}

/**
 * Stops drawing and drops the shape being drawn.
 * @param {L.Map} map - The Leaflet map.
 */
export const stopMeasureDraw = (map: L.Map): void => {
  map.pm?.disableDraw()
}

/**
 * Finishes the shape being drawn.
 * @param {L.Map} map - The Leaflet map.
 * @param {GeomanShape} shape - The shape being drawn.
 */
export const finishMeasureDraw = (map: L.Map, shape: GeomanShape): void => {
  // same private call as Geoman's own Enter handler (Keyboard._handleEnterKey); checked against 2.20.2
  const drawInstance = map.pm?.Draw[shape] as unknown as GeomanDrawInstance | undefined
  drawInstance?._finishShape?.()
}

/**
 * Keeps mouse events on an element inside the map container away from Leaflet: no vertex, no map drag,
 * no rubber-band move while the pointer is on the element.
 * @param {HTMLElement} element - The element (the container of the measure bar).
 */
export const isolateFromMap = (element: HTMLElement): void => {
  L.DomEvent.disableClickPropagation(element)
  L.DomEvent.disableScrollPropagation(element)
  // Leaflet ignores clicks by looking for the element among the target ancestors: a dropdown option removed by React
  // while handling the click has none, so the click must not reach the map at all
  L.DomEvent.on(element, 'click mousemove', L.DomEvent.stopPropagation)
}
