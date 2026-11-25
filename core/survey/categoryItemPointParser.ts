import type { ArenaPoint } from '@openforis/arena-core'
import { Objects, Points } from '@openforis/arena-core'

/**
 * Parses a geometry point value (WKT or JSON format) into a point object.
 * Returns null if the value is empty or unparseable.
 */
export const parsePoint = (geometryPoint: string | null | undefined): ArenaPoint | null => {
  if (Objects.isEmpty(geometryPoint)) return null
  const point = Points.parse(geometryPoint as string)
  if (point) return point
  try {
    return JSON.parse(geometryPoint as string)
  } catch {
    return null
  }
}
