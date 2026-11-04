import type { MapRecordCandidate } from '../mapWorkspaceTypes'
import { getUtmBand, utmToLatLon } from '../statusbar/coordinateFormat'

export type MapSearchQuery =
  | { type: 'empty' }
  | { type: 'coordinates'; lat: number; lng: number }
  | { type: 'invalidCoordinates' }
  | { type: 'text'; text: string }

export type MapSearchResult =
  | { type: 'coordinates'; lat: number; lng: number }
  | { type: 'invalidCoordinates' }
  | { type: 'record'; candidate: MapRecordCandidate }
  | { type: 'noMatch' }

export const MAP_SEARCH_MAX_RECORDS = 8

// "37M 271977 E 9953205 N", "37m 271977 9953205", "37M 271977.5, 9953205"
const UTM_PATTERN = /^(\d{1,2})\s*([C-HJ-NP-X])\s+(\d+(?:\.\d+)?)\s*E?\s*[,;]?\s*(\d+(?:\.\d+)?)\s*N?$/i
// one "12°30′15″ N" part; minutes and seconds optional, ' and ’ accepted for ′, " ” “ accepted for ″, comma decimals accepted
const DMS_PART_PATTERN =
  /(\d{1,3}(?:[.,]\d+)?)\s*°\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d{1,2}(?:[.,]\d+)?)\s*(?:["″”“]|''|’’)\s*)?([NSEW])/gi
// "41.9, 12.5", "41,9 12,5", "-0.42;36.95"
const DECIMAL_PAIR_PATTERN = /^([+-]?\d+(?:[.,]\d+)?)\s*[,;\s]\s*([+-]?\d+(?:[.,]\d+)?)$/
const UTM_MIN_EASTING = 100000
const UTM_MAX_EASTING = 900000
const UTM_MAX_NORTHING = 10000000

/**
 * Converts a number text (dot or comma decimals) to a number.
 * @param {string|undefined} text - The number text.
 * @returns {number} The number; 0 when the text is missing.
 */
const toNumber = (text: string | undefined): number => (text ? Number(text.replace(',', '.')) : 0)

/**
 * Checks that a latitude/longitude pair is finite and within range.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @returns {boolean} True when the pair is valid.
 */
const isValidLatLng = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

/**
 * Builds the query for a latitude/longitude pair.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @returns {MapSearchQuery} Coordinates, or invalid coordinates when out of range.
 */
const toCoordinatesQuery = (lat: number, lng: number): MapSearchQuery =>
  isValidLatLng(lat, lng) ? { type: 'coordinates', lat, lng } : { type: 'invalidCoordinates' }

// latitudes covered by UTM
const UTM_MIN_LAT = -80
const UTM_MAX_LAT = 84

/**
 * Converts a UTM coordinate whose letter is a latitude band (C-M south, N-X north) or, for S and N, a hemisphere.
 * @param {object} params - Parameters.
 * @param {number} params.zone - Zone number.
 * @param {string} params.letter - The upper case letter after the zone.
 * @param {number} params.easting - Easting in metres.
 * @param {number} params.northing - Northing in metres.
 * @returns {{lat: number, lng: number}|null} The point, or null when no reading fits within UTM latitudes.
 */
const resolveUtmPoint = (params: {
  zone: number
  letter: string
  easting: number
  northing: number
}): { lat: number; lng: number } | null => {
  const { zone, letter, easting, northing } = params
  const inRange = (point: { lat: number; lng: number } | null | undefined) =>
    point && point.lat >= UTM_MIN_LAT && point.lat <= UTM_MAX_LAT ? point : null
  const asBand = inRange(utmToLatLon({ zone, southern: letter < 'N', easting, northing }))
  if (asBand && getUtmBand(asBand.lat) === letter) return asBand
  // "37S" is also the common way to write "zone 37, southern hemisphere"
  if (letter !== 'S' && letter !== 'N') return null
  return inRange(utmToLatLon({ zone, southern: letter === 'S', easting, northing }))
}

/**
 * Parses a UTM coordinate text.
 * @param {string} text - The trimmed search text.
 * @returns {MapSearchQuery|null} The query, or null when the text is not UTM shaped.
 */
const parseUtm = (text: string): MapSearchQuery | null => {
  const match = UTM_PATTERN.exec(text)
  if (!match) return null
  const [, zoneText, band, eastingText, northingText] = match
  const zone = Number(zoneText)
  const easting = Number(eastingText)
  const northing = Number(northingText)
  if (zone < 1 || zone > 60 || easting < UTM_MIN_EASTING || easting > UTM_MAX_EASTING || northing > UTM_MAX_NORTHING) {
    return { type: 'invalidCoordinates' }
  }
  const point = resolveUtmPoint({ zone, letter: band.toUpperCase(), easting, northing })
  return point ? toCoordinatesQuery(point.lat, point.lng) : { type: 'invalidCoordinates' }
}

/**
 * Converts degrees, minutes and seconds texts to decimal degrees.
 * @param {string} degrees - Degrees text.
 * @param {string|undefined} minutes - Minutes text.
 * @param {string|undefined} seconds - Seconds text.
 * @returns {number|null} Decimal degrees, or null when minutes or seconds are 60 or more.
 */
const dmsPartToDegrees = (degrees: string, minutes: string | undefined, seconds: string | undefined): number | null => {
  const minutesValue = toNumber(minutes)
  const secondsValue = toNumber(seconds)
  if (minutesValue >= 60 || secondsValue >= 60) return null
  return toNumber(degrees) + minutesValue / 60 + secondsValue / 3600
}

/**
 * Parses a DMS coordinate text (latitude and longitude in either order).
 * @param {string} rawText - The trimmed search text.
 * @returns {MapSearchQuery|null} The query, or null when the text has no degree sign.
 */
const parseDms = (rawText: string): MapSearchQuery | null => {
  // º (ordinal indicator) and ˚ (ring above) are common stand-ins for the degree sign
  const text = rawText.replace(/[º˚]/g, '°')
  if (!text.includes('°')) return null
  const values: Record<string, number> = {}
  for (const match of text.matchAll(DMS_PART_PATTERN)) {
    const [, degrees, minutes, seconds, letterText] = match
    const letter = letterText.toUpperCase()
    const value = dmsPartToDegrees(degrees, minutes, seconds)
    if (value === null) return { type: 'invalidCoordinates' }
    const axis = letter === 'N' || letter === 'S' ? 'lat' : 'lng'
    if (axis in values) return { type: 'invalidCoordinates' }
    values[axis] = letter === 'S' || letter === 'W' ? -value : value
  }
  const rest = text.replace(DMS_PART_PATTERN, '').replace(/[\s,;]/g, '')
  if (rest.length > 0 || !('lat' in values) || !('lng' in values)) return { type: 'invalidCoordinates' }
  return toCoordinatesQuery(values.lat, values.lng)
}

/**
 * Parses a decimal "lat, lon" pair.
 * @param {string} text - The trimmed search text.
 * @returns {MapSearchQuery|null} The query, or null when the text is not a decimal pair.
 */
const parseDecimalPair = (text: string): MapSearchQuery | null => {
  const match = DECIMAL_PAIR_PATTERN.exec(text)
  return match ? toCoordinatesQuery(toNumber(match[1]), toNumber(match[2])) : null
}

/**
 * Parses what the user typed in the map search box: coordinates (decimal "lat, lon", DMS or UTM) or free text.
 * @param {string} input - The search box text.
 * @returns {MapSearchQuery} The parsed query.
 */
export const parseMapSearchQuery = (input: string): MapSearchQuery => {
  const text = input.trim()
  if (!text) return { type: 'empty' }
  return parseUtm(text) ?? parseDms(text) ?? parseDecimalPair(text) ?? { type: 'text', text }
}

/**
 * Ranks how well a label matches the text.
 * @param {string} label - Lowercase label.
 * @param {string} text - Lowercase text.
 * @returns {number} 0 exact, 1 prefix, 2 substring, -1 no match.
 */
const getMatchRank = (label: string, text: string): number => {
  if (label === text) return 0
  if (label.startsWith(text)) return 1
  return label.includes(text) ? 2 : -1
}

/**
 * Finds the records whose label matches the text: exact matches first, then prefixes, then substrings.
 * @param {MapRecordCandidate[]} candidates - Records shown on the map.
 * @param {string} text - Text to look for (case-insensitive).
 * @param {number} [limit] - Maximum number of results.
 * @returns {MapRecordCandidate[]} The matching records.
 */
export const findRecordCandidates = (
  candidates: MapRecordCandidate[],
  text: string,
  limit = MAP_SEARCH_MAX_RECORDS
): MapRecordCandidate[] => {
  const query = text.trim().toLocaleLowerCase()
  if (!query) return []
  const ranked: Array<{ candidate: MapRecordCandidate; rank: number }> = []
  for (const candidate of candidates) {
    const rank = getMatchRank(candidate.label.toLocaleLowerCase(), query)
    if (rank >= 0) ranked.push({ candidate, rank })
  }
  ranked.sort(
    (a, b) => a.rank - b.rank || a.candidate.label.localeCompare(b.candidate.label, undefined, { numeric: true })
  )
  return ranked.slice(0, limit).map(({ candidate }) => candidate)
}

/**
 * Builds the search results: the coordinates (or the invalid coordinates notice) first, then the matching records.
 * @param {object} params - Parameters.
 * @param {string} params.input - The search box text.
 * @param {MapRecordCandidate[]} params.candidates - Records shown on the map (empty when the Records list is not available).
 * @returns {MapSearchResult[]} The results; [] for an empty input, [{type: 'noMatch'}] when nothing matches.
 */
export const buildMapSearchResults = ({
  input,
  candidates,
}: {
  input: string
  candidates: MapRecordCandidate[]
}): MapSearchResult[] => {
  const query = parseMapSearchQuery(input)
  if (query.type === 'empty') return []
  const results: MapSearchResult[] = []
  if (query.type === 'coordinates' || query.type === 'invalidCoordinates') results.push(query)
  for (const candidate of findRecordCandidates(candidates, input)) {
    results.push({ type: 'record', candidate })
  }
  return results.length > 0 ? results : [{ type: 'noMatch' }]
}
