import area from '@turf/area'
import centroid from '@turf/centroid'
import length from '@turf/length'

const countVertices = (geoJson) => {
  const polygon = geoJson.type === 'Feature' ? geoJson.geometry : geoJson
  return polygon?.coordinates?.[0]?.length ?? 0
}

const parse = (geoJsonText) => {
  let geoJson = null
  try {
    geoJson = JSON.parse(geoJsonText)
  } catch (_error) {
    // ignore it
  }
  return validateFeature(geoJson) ? geoJson : null
}

const pointFeatureToPoint = (pointFeature) => {
  if (!pointFeature) return null
  const [x, y] = pointFeature.geometry?.coordinates ?? []
  return { x, y }
}

const validateFeature = (geoJson) => geoJson?.type === 'Feature' && !!geoJson.geometry

export const GeoJsonUtils = {
  area,
  centroid,
  countVertices,
  parse,
  perimeter: length,
  pointFeatureToPoint,
  validateFeature,
}
