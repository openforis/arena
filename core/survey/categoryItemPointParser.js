import { Objects, Points } from '@openforis/arena-core'

/**
 * Parses a geometry point value (WKT or JSON format) into a point object.
 * Returns null if the value is empty or unparseable.
 * @param {string|null} geometryPoint - The geometry point to parse (WKT or JSON format).
 * @returns {object|null} A point object with {x, y, srs} properties, or null if unparseable.
 */
export const parsePoint = (geometryPoint) => {
  if (Objects.isEmpty(geometryPoint)) return null
  const point = Points.parse(geometryPoint)
  if (point) return point
  try {
    return JSON.parse(geometryPoint)
  } catch (error) {
    return null
  }
}
