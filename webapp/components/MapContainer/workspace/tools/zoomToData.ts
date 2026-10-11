export type LatLngLiteral = { lat: number; lng: number }

export type BoundsLiteral = { south: number; west: number; north: number; east: number }

// panes of tiles and labels: never data
const NON_DATA_PANES = new Set(['tilePane', 'tooltipPane'])

/**
 * Returns the bounds of the finite points.
 * @param {LatLngLiteral[]} points - Points.
 * @returns {BoundsLiteral|null} The bounds, or null when there is no finite point.
 */
export const computeBounds = (points: LatLngLiteral[]): BoundsLiteral | null => {
  let bounds: BoundsLiteral | null = null
  for (const { lat, lng } of points) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    bounds = bounds
      ? {
          south: Math.min(bounds.south, lat),
          west: Math.min(bounds.west, lng),
          north: Math.max(bounds.north, lat),
          east: Math.max(bounds.east, lng),
        }
      : { south: lat, west: lng, north: lat, east: lng }
  }
  return bounds
}

/**
 * Tells whether a map layer shows data (markers, polygons, uploaded files) rather than tiles, grid lines or labels.
 * @param {object} layerInfo - What is known about the layer.
 * @param {boolean} layerInfo.isGridLayer - Whether it is a tile (grid) layer.
 * @param {boolean} [layerInfo.interactive] - Its `interactive` option (false for the UTM grid).
 * @param {string} [layerInfo.pane] - Its pane.
 * @returns {boolean} True for data layers.
 */
export const isDataLayer = ({
  isGridLayer,
  interactive,
  pane,
}: {
  isGridLayer: boolean
  interactive?: boolean
  pane?: string
}): boolean => !isGridLayer && interactive !== false && !NON_DATA_PANES.has(pane ?? '')
