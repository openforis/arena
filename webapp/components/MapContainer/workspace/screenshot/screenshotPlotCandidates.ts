import type {
  LatLngLiteral,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

// structural copy of the GeoJSON points built by convertDataToGeoJsonPoints (Data › Map location layers)
export type MapPlotPoint = {
  geometry?: { coordinates?: number[] }
  properties?: { key?: string; recordUuid?: string; parentUuid?: string; ancestorsKeys?: unknown[] }
}

export type MapPlotPointsLayer = {
  layerKey: string
  entityDefUuid: string
  entityName: string
  entityLabel: string
  points: MapPlotPoint[]
}

/**
 * Turns the ancestor key values of a point into non-empty texts.
 * @param {Array<unknown>} [ancestorsKeys] - The key values.
 * @returns {Array<string>} The key texts.
 */
const toKeyTexts = (ancestorsKeys: unknown[] = []): string[] =>
  ancestorsKeys
    .map((key) => (key === null || key === undefined ? '' : String(key).trim()))
    .filter((key) => key.length > 0)

/**
 * Builds the plot candidate of a point, when the point is valid.
 * @param {MapPlotPointsLayer} layer - The layer of the point.
 * @param {MapPlotPoint} point - The point.
 * @returns {ScreenshotPlotCandidate|null} The candidate, or null for a point without coordinates or record.
 */
const toCandidate = (layer: MapPlotPointsLayer, point: MapPlotPoint): ScreenshotPlotCandidate | null => {
  const [lng, lat] = point?.geometry?.coordinates ?? []
  const { key, recordUuid, parentUuid, ancestorsKeys } = point?.properties ?? {}
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !key || !recordUuid || !parentUuid) return null
  const keys = toKeyTexts(ancestorsKeys)
  return {
    key,
    recordUuid,
    parentUuid,
    entityDefUuid: layer.entityDefUuid,
    entityName: layer.entityName,
    keys,
    label: [layer.entityLabel, keys.join(' - ')].filter((text) => text.length > 0).join(' '),
    lat,
    lng,
  }
}

/**
 * Computes a planar distance in degrees, with longitudes shrunk by the cosine of the latitude (fine for sorting).
 * @param {LatLngLiteral} a - First point.
 * @param {LatLngLiteral} b - Second point.
 * @returns {number} The distance.
 */
export const planarDistance = (a: LatLngLiteral, b: LatLngLiteral): number => {
  const meanLatRad = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  return Math.hypot((a.lng - b.lng) * Math.cos(meanLatRad), a.lat - b.lat)
}

/**
 * Builds the plot list of the screenshot dialog from the points of the shown location layers.
 * @param {object} params - The parameters.
 * @param {Array<MapPlotPointsLayer>} params.layers - The registered layers.
 * @param {LatLngLiteral|null} params.center - The map centre; null sorts by label.
 * @returns {Array<ScreenshotPlotCandidate>} One candidate per plot, nearest first.
 */
export const buildPlotCandidates = ({
  layers,
  center,
}: {
  layers: MapPlotPointsLayer[]
  center: LatLngLiteral | null
}): ScreenshotPlotCandidate[] => {
  const byKey = new Map<string, ScreenshotPlotCandidate>()
  for (const layer of layers) {
    for (const point of layer.points) {
      const candidate = toCandidate(layer, point)
      if (candidate && !byKey.has(candidate.key)) byKey.set(candidate.key, candidate)
    }
  }
  const candidates = [...byKey.values()]
  if (!center) return candidates.sort((a, b) => a.label.localeCompare(b.label))
  return candidates
    .map((candidate) => ({ candidate, distance: planarDistance(candidate, center) }))
    .sort((a, b) => a.distance - b.distance || a.candidate.label.localeCompare(b.candidate.label))
    .map(({ candidate }) => candidate)
}
