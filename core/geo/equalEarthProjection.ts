export interface LonLat {
  lon: number
  lat: number
}

interface MercatorMeters {
  x: number
  y: number
}

// Sphere radius (meters) used by Web Mercator (EPSG:3857). Using the same radius
// for the Equal Earth projection below keeps both projections at a comparable
// scale, which is required for the warp trick in warpLonLatToEqualEarthInMercator.
const WEB_MERCATOR_RADIUS = 6378137

// Equal Earth projection coefficients (Šavrič, Patterson & Jenny, 2018).
const A1 = 1.340264
const A2 = -0.081106
const A3 = 0.000893
const A4 = 0.003796
const SQRT3 = Math.sqrt(3)

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
const toDegrees = (radians: number): number => (radians * 180) / Math.PI

/**
 * Projects a WGS84 longitude/latitude (degrees) to Equal Earth projected meters.
 */
export const projectToEqualEarthMeters = ({ lon, lat }: LonLat): MercatorMeters => {
  const lambda = toRadians(lon)
  const phi = toRadians(lat)
  const theta = Math.asin((SQRT3 / 2) * Math.sin(phi))
  const theta2 = theta * theta
  const theta6 = theta2 * theta2 * theta2
  const theta8 = theta6 * theta2
  const denominator = 3 * (9 * A4 * theta8 + 7 * A3 * theta6 + 3 * A2 * theta2 + A1)
  const x = (2 * SQRT3 * lambda * Math.cos(theta)) / denominator
  const y = theta * (A4 * theta8 + A3 * theta6 + A2 * theta2 + A1)
  return { x: x * WEB_MERCATOR_RADIUS, y: y * WEB_MERCATOR_RADIUS }
}

/**
 * Inverse Web Mercator (EPSG:3857): converts meters back to a WGS84 longitude/latitude.
 */
export const unprojectWebMercatorMeters = ({ x, y }: MercatorMeters): LonLat => ({
  lon: toDegrees(x / WEB_MERCATOR_RADIUS),
  lat: toDegrees(2 * Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS)) - Math.PI / 2),
})

/**
 * Warps a true WGS84 longitude/latitude so that rendering it through a standard
 * Web Mercator forward projection reproduces the Equal Earth projection. Because
 * forwardMercator(inverseMercator(x, y)) === (x, y), any Mercator-only renderer
 * (Leaflet, MapLibre, etc.) that projects the warped coordinate forward will draw
 * it at the true Equal Earth-projected position.
 */
export const warpLonLatToEqualEarthInMercator = (lonLat: LonLat): LonLat =>
  unprojectWebMercatorMeters(projectToEqualEarthMeters(lonLat))
