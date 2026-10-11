import L from 'leaflet'
import { domToCanvas } from 'modern-screenshot'

import {
  createImageFailureCounter,
  isMapAtCaptureView,
  shouldExcludeFromCapture,
  waitUntil,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotCaptureRules'
import type {
  LatLngLiteral,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

export type MapCaptureResult = {
  canvas: HTMLCanvasElement
  failedImages: number
  center: LatLngLiteral
  zoom: number
}

const CAPTURE_BACKGROUND = '#dfe3e8'
const CAPTURE_TIMEOUT_MS = 15000
const TILES_TIMEOUT_MS = 8000
const TILES_POLL_MS = 100
const TILES_SETTLE_MS = 300 // Leaflet tile fade-in

type MaybeMaplibreLayer = L.Layer & { getMaplibreMap?: unknown }
type MaybeLoadingLayer = L.Layer & { isLoading?: () => boolean }

/**
 * Tells whether the map shows a MapLibre (WebGL) layer, which cannot be captured (Equal Earth).
 * @param {L.Map} map - The map.
 * @returns {boolean} True when such a layer is on the map.
 */
export const hasMaplibreLayer = (map: L.Map): boolean => {
  let found = false
  map.eachLayer((layer) => {
    if (typeof (layer as MaybeMaplibreLayer).getMaplibreMap === 'function') found = true
  })
  return found
}

/**
 * Tells whether a tile or grid layer (base maps, WMS, COGs) is still loading tiles.
 * @param {L.Map} map - The map.
 * @returns {boolean} True while tiles load.
 */
const areTilesLoading = (map: L.Map): boolean => {
  let loading = false
  map.eachLayer((layer) => {
    if (layer instanceof L.GridLayer && (layer as MaybeLoadingLayer).isLoading?.()) loading = true
  })
  return loading
}

/**
 * Waits for a number of milliseconds.
 * @param {number} ms - The time.
 * @returns {Promise<void>} Resolves after the time.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Waits until the tiles of the map are loaded (8 s at most), then for their fade-in.
 * @param {L.Map} map - The map.
 * @returns {Promise<boolean>} True when loaded, false on timeout.
 */
export const waitForMapTiles = (map: L.Map): Promise<boolean> =>
  waitUntil({
    predicate: () => !areTilesLoading(map),
    timeoutMs: TILES_TIMEOUT_MS,
    intervalMs: TILES_POLL_MS,
    settleMs: TILES_SETTLE_MS,
    sleep,
    now: () => Date.now(),
  })

/**
 * Captures the current view of the map at CSS pixel scale; tiles that cannot be fetched become transparent.
 * @param {object} params - The parameters.
 * @param {L.Map} params.map - The map.
 * @param {boolean} params.includeData - Whether markers and measurements are captured.
 * @returns {Promise<MapCaptureResult>} The canvas, the failed images count and the view.
 */
export const captureMapView = async ({
  map,
  includeData,
}: {
  map: L.Map
  includeData: boolean
}): Promise<MapCaptureResult> => {
  await waitForMapTiles(map)
  const { lat, lng } = map.getCenter()
  const zoom = map.getZoom()
  const failures = createImageFailureCounter()
  const container = map.getContainer()
  // modern-screenshot calls the filter with the original (not cloned) child nodes, so parentElement is the live parent
  const canvas = await domToCanvas(container, {
    scale: 1,
    backgroundColor: CAPTURE_BACKGROUND,
    timeout: CAPTURE_TIMEOUT_MS,
    font: false,
    filter: (node: Node) =>
      !(node instanceof Element) ||
      !shouldExcludeFromCapture(
        { classList: node.classList, isMapContainerChild: node.parentElement === container },
        includeData
      ),
    fetch: { placeholderImage: failures.placeholderImage },
  })
  return { canvas, failedImages: failures.getCount(), center: { lat, lng }, zoom }
}

/**
 * Centres the map on a plot, captures it, then restores the previous view.
 * @param {object} params - The parameters.
 * @param {L.Map} params.map - The map.
 * @param {boolean} params.includeData - Whether markers and measurements are captured.
 * @param {ScreenshotPlotCandidate} params.plot - The plot.
 * @param {number} params.zoom - The fit-to-plot zoom.
 * @returns {Promise<MapCaptureResult>} The capture.
 */
export const captureMapAtPlot = async ({
  map,
  includeData,
  plot,
  zoom,
}: {
  map: L.Map
  includeData: boolean
  plot: ScreenshotPlotCandidate
  zoom: number
}): Promise<MapCaptureResult> => {
  const previousCenter = map.getCenter()
  const previousZoom = map.getZoom()
  map.setView([plot.lat, plot.lng], zoom, { animate: false })
  const setCenter = map.getCenter()
  const setZoom = map.getZoom()
  try {
    return await captureMapView({ map, includeData })
  } finally {
    // the user may have moved the map meanwhile (dialog closed during a slow capture): then leave it alone
    if (isMapAtCaptureView({ current: map.getCenter(), currentZoom: map.getZoom(), set: setCenter, setZoom })) {
      map.setView(previousCenter, previousZoom, { animate: false })
    }
  }
}
