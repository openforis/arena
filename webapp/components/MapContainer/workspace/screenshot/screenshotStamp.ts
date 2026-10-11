import { formatCoordinates } from '@webapp/components/MapContainer/workspace/statusbar/coordinateFormat'
import type { LatLngLiteral } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

const HTML_ENTITIES: Record<string, string> = {
  '#39': "'",
  amp: '&',
  copy: '©',
  gt: '>',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
}

const SEPARATOR = ' · '

/**
 * Turns an HTML attribution into plain text: tags removed, common entities decoded in one pass, spaces collapsed.
 * @param {string|null} [html] - The attribution HTML.
 * @returns {string} The plain text.
 */
export const stripHtml = (html?: string | null): string => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#39|amp|copy|gt|lt|mdash|nbsp|ndash|quot);/g, (_match, entity: string) => HTML_ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Collects the attributions to print: the base layer's, then those of the visible overlays, without duplicates.
 * @param {object} params - The parameters.
 * @param {string|null} [params.baseLayerAttribution] - Attribution HTML of the base layer.
 * @param {Array<object>} [params.overlays] - Overlays with visible flag and optional attribution.
 * @returns {Array<string>} The plain text attributions.
 */
export const collectAttributions = ({
  baseLayerAttribution = null,
  overlays = [],
}: {
  baseLayerAttribution?: string | null
  overlays?: Array<{ visible: boolean; attribution?: string }>
}): string[] => {
  const result: string[] = []
  const candidates = [baseLayerAttribution, ...overlays.filter((overlay) => overlay.visible).map((o) => o.attribution)]
  for (const candidate of candidates) {
    const text = stripHtml(candidate)
    if (text && !result.includes(text)) result.push(text)
  }
  return result
}

/**
 * Formats the coordinates printed in the stamp (Lat, Lon notation of the status bar).
 * @param {LatLngLiteral|null} [point] - The point.
 * @returns {string} The coordinates, or an empty string without a valid point.
 */
export const formatStampCoordinates = (point?: LatLngLiteral | null): string =>
  point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
    ? formatCoordinates(point.lat, point.lng, 'latLon')
    : ''

/**
 * Builds the stamp text lines.
 * @param {object} params - The parameters.
 * @param {string|null} [params.plotLabel] - Label of the plot, if any.
 * @param {string} params.dateText - The date (yyyy-mm-dd).
 * @param {string} [params.coordinatesText] - The coordinates of the plot or of the map centre.
 * @param {string|null} [params.baseMapName] - Name of the base map.
 * @param {Array<string>} [params.attributions] - Plain text attributions.
 * @returns {{left: Array<string>, right: Array<string>}} The left and right lines, empty ones removed.
 */
export const buildStampLines = ({
  plotLabel = null,
  dateText,
  coordinatesText = '',
  baseMapName = '',
  attributions = [],
}: {
  plotLabel?: string | null
  dateText: string
  coordinatesText?: string
  baseMapName?: string | null
  attributions?: string[]
}): { left: string[]; right: string[] } => {
  const firstLine = plotLabel ? `${plotLabel}${SEPARATOR}${dateText}` : dateText
  return {
    left: [firstLine, coordinatesText ?? ''].filter((line) => line.length > 0),
    right: [baseMapName ?? '', attributions.join(SEPARATOR)].filter((line) => line.length > 0),
  }
}
