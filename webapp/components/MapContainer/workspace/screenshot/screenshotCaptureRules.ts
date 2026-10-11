import type {
  LatLngLiteral,
  ScreenshotNotice,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

export const FIT_TO_PLOT_MAX_ZOOM = 17

// 1×1 transparent GIF, standing in for tiles that fail to load
export const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const MAP_PANE_CLASS = 'leaflet-map-pane'

const ALWAYS_EXCLUDED_CLASSES = ['leaflet-popup-pane']

// Vector and marker panes (measurements, drawn areas, footprints, markers). Sentinel-2 scenes are rasters and stay: a
// base scene lives in tilePane, an overlay scene in arenaSentinel2OverlayPane.
const DATA_PANE_CLASSES = ['leaflet-overlay-pane', 'leaflet-marker-pane', 'leaflet-shadow-pane', 'leaflet-tooltip-pane']

/**
 * Returns the zoom used by "Fit to plot": 17, or lower when the map or the base layer has a lower max zoom.
 * @param {object} params - The parameters.
 * @param {number|null} [params.mapMaxZoom] - Max zoom of the map (Infinity when no layer sets one).
 * @param {number|null} [params.baseLayerMaxZoom] - Max zoom of the base layer.
 * @returns {number} The zoom.
 */
export const getFitToPlotZoom = ({
  mapMaxZoom = null,
  baseLayerMaxZoom = null,
}: {
  mapMaxZoom?: number | null
  baseLayerMaxZoom?: number | null
}): number =>
  Math.min(
    ...[FIT_TO_PLOT_MAX_ZOOM, mapMaxZoom, baseLayerMaxZoom].filter(
      (zoom): zoom is number => typeof zoom === 'number' && Number.isFinite(zoom)
    )
  )

export type CaptureNodeInfo = {
  classList: { contains: (token: string) => boolean } | null | undefined
  isMapContainerChild: boolean
}

/**
 * Tells whether an element of the map is left out of the capture.
 * Of the map container's own children only the map pane is kept: the control corners and anything
 * portaled into the container (Part 2's measure bar) are left out.
 * @param {CaptureNodeInfo} node - Class list of the element (null for non-elements) and whether its parent is the map container.
 * @param {boolean} includeData - Whether markers and measurements are included.
 * @returns {boolean} True to leave the element out.
 */
export const shouldExcludeFromCapture = (
  { classList, isMapContainerChild }: CaptureNodeInfo,
  includeData: boolean
): boolean => {
  if (isMapContainerChild) return !classList?.contains(MAP_PANE_CLASS)
  if (!classList) return false
  if (ALWAYS_EXCLUDED_CLASSES.some((name) => classList.contains(name))) return true
  return !includeData && DATA_PANE_CLASSES.some((name) => classList.contains(name))
}

export type WaitUntilParams = {
  predicate: () => boolean
  timeoutMs: number
  intervalMs: number
  settleMs?: number
  sleep: (ms: number) => Promise<void>
  now: () => number
}

/**
 * Polls a condition until it holds or the timeout passes; when it holds, waits for the settle time.
 * @param {WaitUntilParams} params - The condition, the timings and the injected clock.
 * @returns {Promise<boolean>} True when the condition held, false on timeout.
 */
export const waitUntil = async ({
  predicate,
  timeoutMs,
  intervalMs,
  settleMs = 0,
  sleep,
  now,
}: WaitUntilParams): Promise<boolean> => {
  const start = now()
  /**
   * Checks the condition once and schedules the next check.
   * @returns {Promise<boolean>} The final result.
   */
  const poll = async (): Promise<boolean> => {
    if (predicate()) return true
    if (now() - start >= timeoutMs) return false
    await sleep(intervalMs)
    return poll()
  }
  const ready = await poll()
  if (ready && settleMs > 0) await sleep(settleMs)
  return ready
}

/**
 * Creates the placeholder used for images that cannot be fetched (no CORS, offline) and counts them.
 * @returns {{placeholderImage: Function, getCount: Function}} The placeholder factory and the counter.
 */
export const createImageFailureCounter = (): { placeholderImage: () => string; getCount: () => number } => {
  let count = 0
  return {
    /**
     * Counts a failed image and returns the transparent placeholder.
     * @returns {string} The placeholder data URL.
     */
    placeholderImage: (): string => {
      count += 1
      return TRANSPARENT_PIXEL
    },
    /**
     * Returns the number of failed images.
     * @returns {number} The count.
     */
    getCount: (): number => count,
  }
}

/**
 * Returns the notice shown under the preview after a capture.
 * @param {object} params - The parameters.
 * @param {number} params.failedImages - Number of images (tiles) left out.
 * @param {boolean} params.maplibre - Whether the base map is the MapLibre (WebGL) Equal Earth map.
 * @returns {ScreenshotNotice|null} The notice, or null when all went well.
 */
export const getCaptureNotice = ({
  failedImages,
  maplibre,
}: {
  failedImages: number
  maplibre: boolean
}): ScreenshotNotice | null => {
  if (maplibre) return { key: 'mapWorkspace.screenshot.notices.equalEarth', blocking: true }
  if (failedImages > 0) {
    return { key: 'mapWorkspace.screenshot.notices.tilesMissing', params: { count: failedImages }, blocking: false }
  }
  return null
}

const VIEW_CENTER_TOLERANCE_DEGREES = 1e-6

/**
 * Tells whether the map is still at the view a capture set, so the previous view can be restored without undoing
 * a pan or zoom the user made meanwhile (for example after closing the dialog during a slow capture).
 * @param {object} params - The parameters.
 * @param {LatLngLiteral} params.current - Current map center.
 * @param {number} params.currentZoom - Current map zoom.
 * @param {LatLngLiteral} params.set - Center the capture set.
 * @param {number} params.setZoom - Zoom the capture set.
 * @returns {boolean} True when the map has not moved since.
 */
export const isMapAtCaptureView = ({
  current,
  currentZoom,
  set,
  setZoom,
}: {
  current: LatLngLiteral
  currentZoom: number
  set: LatLngLiteral
  setZoom: number
}): boolean =>
  currentZoom === setZoom &&
  Math.abs(current.lat - set.lat) <= VIEW_CENTER_TOLERANCE_DEGREES &&
  Math.abs(current.lng - set.lng) <= VIEW_CENTER_TOLERANCE_DEGREES
