export type CoordinateNotation = 'latLon' | 'dms' | 'utm'

export type UtmCoordinate = { zone: number; band: string; easting: number; northing: number }

export const COORDINATE_NOTATIONS: CoordinateNotation[] = ['latLon', 'dms', 'utm']

// WGS84 ellipsoid and UTM constants
const WGS84_A = 6378137
const WGS84_F = 1 / 298.257223563
const UTM_K0 = 0.9996
const UTM_FALSE_EASTING = 500000
const UTM_FALSE_NORTHING_SOUTH = 10000000
const UTM_MIN_LAT = -80
const UTM_MAX_LAT = 84
const UTM_BANDS = 'CDEFGHJKLMNPQRSTUVWX'

// Krüger series (third flattening n), accurate to well below 1 mm inside a UTM zone
const N = WGS84_F / (2 - WGS84_F)
const E = Math.sqrt(WGS84_F * (2 - WGS84_F))
const RECTIFYING_RADIUS = (WGS84_A / (1 + N)) * (1 + N ** 2 / 4 + N ** 4 / 64)
const ALPHA = [N / 2 - (2 * N ** 2) / 3 + (5 * N ** 3) / 16, (13 * N ** 2) / 48 - (3 * N ** 3) / 5, (61 * N ** 3) / 240]
const BETA = [N / 2 - (2 * N ** 2) / 3 + (37 * N ** 3) / 96, N ** 2 / 48 + N ** 3 / 15, (17 * N ** 3) / 480]
const DELTA = [2 * N - (2 * N ** 2) / 3 - 2 * N ** 3, (7 * N ** 2) / 3 - (8 * N ** 3) / 5, (56 * N ** 3) / 15]

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
const toDegrees = (radians: number): number => (radians * 180) / Math.PI
const pad2 = (value: number): string => String(value).padStart(2, '0')

/**
 * Returns the notation that follows the given one (Lat, Lon → DMS → UTM → Lat, Lon).
 * @param {CoordinateNotation} notation - Current notation.
 * @returns {CoordinateNotation} The next notation.
 */
export const nextCoordinateNotation = (notation: CoordinateNotation): CoordinateNotation =>
  COORDINATE_NOTATIONS[(COORDINATE_NOTATIONS.indexOf(notation) + 1) % COORDINATE_NOTATIONS.length]

/**
 * Wraps a longitude into the range -180..180 (Leaflet gives values outside it when the map is panned across the antimeridian).
 * @param {number} lng - Longitude in degrees.
 * @returns {number} The equivalent longitude between -180 and 180.
 */
export const normalizeLongitude = (lng: number): number => {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180
  return wrapped === -180 && lng > 0 ? 180 : wrapped
}

/**
 * Returns the UTM zone number of a point, with the Norway and Svalbard exceptions.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @returns {number} The zone number (1-60).
 */
export const getUtmZone = (lat: number, lng: number): number => {
  const lon = normalizeLongitude(lng)
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) return 32
  if (lat >= 72 && lat < 84 && lon >= 0 && lon < 42) {
    if (lon < 9) return 31
    if (lon < 21) return 33
    if (lon < 33) return 35
    return 37
  }
  return Math.min(Math.floor((lon + 180) / 6) + 1, 60)
}

/**
 * Returns the UTM latitude band letter (C-X, without I and O).
 * @param {number} lat - Latitude in degrees, between -80 and 84.
 * @returns {string} The band letter.
 */
export const getUtmBand = (lat: number): string =>
  UTM_BANDS[Math.min(Math.floor((lat - UTM_MIN_LAT) / 8), UTM_BANDS.length - 1)]

const getCentralMeridian = (zone: number): number => zone * 6 - 183

/**
 * Converts WGS84 latitude and longitude into UTM.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @returns {UtmCoordinate|null} The UTM coordinate, or null outside the UTM latitudes (-80..84) or for non-finite input.
 */
export const latLonToUtm = (lat: number, lng: number): UtmCoordinate | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < UTM_MIN_LAT || lat > UTM_MAX_LAT) return null
  const zone = getUtmZone(lat, lng)
  const phi = toRadians(lat)
  const lambda = toRadians(normalizeLongitude(lng) - getCentralMeridian(zone))
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - E * Math.atanh(E * Math.sin(phi)))
  const xiPrime = Math.atan2(t, Math.cos(lambda))
  const etaPrime = Math.atanh(Math.sin(lambda) / Math.sqrt(1 + t * t))
  let xi = xiPrime
  let eta = etaPrime
  for (const [index, alpha] of ALPHA.entries()) {
    const j = 2 * (index + 1)
    xi += alpha * Math.sin(j * xiPrime) * Math.cosh(j * etaPrime)
    eta += alpha * Math.cos(j * xiPrime) * Math.sinh(j * etaPrime)
  }
  return {
    zone,
    band: getUtmBand(lat),
    easting: UTM_FALSE_EASTING + UTM_K0 * RECTIFYING_RADIUS * eta,
    northing: UTM_K0 * RECTIFYING_RADIUS * xi + (lat < 0 ? UTM_FALSE_NORTHING_SOUTH : 0),
  }
}

/**
 * Converts a UTM coordinate into WGS84 latitude and longitude.
 * @param {object} params - Parameters.
 * @param {number} params.zone - Zone number (1-60).
 * @param {boolean} params.southern - True for the southern hemisphere.
 * @param {number} params.easting - Easting in metres.
 * @param {number} params.northing - Northing in metres.
 * @returns {{lat: number, lng: number}|null} The point, or null when the zone is not valid.
 */
export const utmToLatLon = ({
  zone,
  southern,
  easting,
  northing,
}: {
  zone: number
  southern: boolean
  easting: number
  northing: number
}): { lat: number; lng: number } | null => {
  if (!Number.isInteger(zone) || zone < 1 || zone > 60) return null
  const xi = (northing - (southern ? UTM_FALSE_NORTHING_SOUTH : 0)) / (UTM_K0 * RECTIFYING_RADIUS)
  const eta = (easting - UTM_FALSE_EASTING) / (UTM_K0 * RECTIFYING_RADIUS)
  let xiPrime = xi
  let etaPrime = eta
  for (const [index, beta] of BETA.entries()) {
    const j = 2 * (index + 1)
    xiPrime -= beta * Math.sin(j * xi) * Math.cosh(j * eta)
    etaPrime -= beta * Math.cos(j * xi) * Math.sinh(j * eta)
  }
  const chi = Math.asin(Math.sin(xiPrime) / Math.cosh(etaPrime))
  let phi = chi
  for (const [index, delta] of DELTA.entries()) {
    phi += delta * Math.sin(2 * (index + 1) * chi)
  }
  const lambda = Math.atan2(Math.sinh(etaPrime), Math.cos(xiPrime))
  return { lat: toDegrees(phi), lng: normalizeLongitude(getCentralMeridian(zone) + toDegrees(lambda)) }
}

const formatDmsPart = (value: number, positiveLetter: string, negativeLetter: string): string => {
  // rounding on the total seconds carries 59.6″ into the next minute (and degree)
  const totalSeconds = Math.round(Math.abs(value) * 3600)
  const letter = value < 0 && totalSeconds > 0 ? negativeLetter : positiveLetter
  const degrees = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${degrees}°${pad2(minutes)}′${pad2(seconds)}″ ${letter}`
}

/**
 * Formats a point in degrees, minutes and seconds.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @returns {string} E.g. "0°25′23″ S, 36°57′04″ E".
 */
export const formatDms = (lat: number, lng: number): string =>
  `${formatDmsPart(lat, 'N', 'S')}, ${formatDmsPart(normalizeLongitude(lng), 'E', 'W')}`

/**
 * Formats a UTM coordinate rounded to the metre.
 * @param {UtmCoordinate} utm - The UTM coordinate.
 * @returns {string} E.g. "37M 271977 E 9953205 N".
 */
export const formatUtm = ({ zone, band, easting, northing }: UtmCoordinate): string =>
  `${zone}${band} ${Math.round(easting)} E ${Math.round(northing)} N`

/**
 * Formats a point in the given notation.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lng - Longitude in degrees.
 * @param {CoordinateNotation} notation - The notation.
 * @returns {string} The formatted point; "—" when UTM is not defined for the point.
 */
export const formatCoordinates = (lat: number, lng: number, notation: CoordinateNotation): string => {
  if (notation === 'dms') return formatDms(lat, lng)
  if (notation === 'utm') {
    const utm = latLonToUtm(lat, lng)
    return utm ? formatUtm(utm) : '—'
  }
  return `${lat.toFixed(5)}, ${normalizeLongitude(lng).toFixed(5)}`
}
