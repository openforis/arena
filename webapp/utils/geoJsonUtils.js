import { PointFactory } from '@openforis/arena-core'
import area from '@turf/area'
import turfCentroid from '@turf/centroid'
import length from '@turf/length'

const Type = {
  Feature: 'Feature',
  FeatureCollection: 'FeatureCollection',
}

const centroidFeature = turfCentroid

const centroidPoint = (geoJson) => pointFeatureToPoint(centroidFeature(geoJson))

const countVertices = (geoJsonOrGeometry) => {
  const geometry = geoJsonOrGeometry.type === Type.Feature ? geoJsonOrGeometry.geometry : geoJsonOrGeometry
  return geometry?.coordinates?.[0]?.length ?? 0
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
  return PointFactory.createInstance({ x, y })
}

const validateFeature = (geoJson) => {
  const { features, geometry, type } = geoJson ?? {}
  if (!type) return false
  switch (type) {
    case Type.Feature:
      return !!geometry
    case Type.FeatureCollection:
      return !!features
    default:
      return false
  }
}

export const GeoJsonUtils = {
  area,
  centroidFeature,
  centroidPoint,
  countVertices,
  parse,
  perimeter: length,
  pointFeatureToPoint,
  validateFeature,
}
