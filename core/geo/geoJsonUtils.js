import area from '@turf/area'
import turfBboxPolygon from '@turf/bbox-polygon'
import turfCentroid from '@turf/centroid'
import turfCircle from '@turf/circle'
import turfDestination from '@turf/destination'
import { point as turfPoint } from '@turf/helpers'
import length from '@turf/length'

import { Objects, PointFactory } from '@openforis/arena-core'

const Type = {
  Feature: 'Feature',
  FeatureCollection: 'FeatureCollection',
}

const centroidFeature = turfCentroid

const countVertices = (geoJsonOrGeometry) => {
  const geometry = geoJsonOrGeometry.type === Type.Feature ? geoJsonOrGeometry.geometry : geoJsonOrGeometry
  return geometry?.coordinates?.[0]?.length ?? 0
}

const createPointFeature = ({ x, y, properties }) => ({
  type: Type.Feature,
  geometry: {
    type: 'Point',
    coordinates: [x, y],
  },
  properties,
})

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

const centroidPoint = (geoJson) => pointFeatureToPoint(centroidFeature(geoJson))

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

const bboxPolygon = (coordinates) => turfBboxPolygon(coordinates)

const rectangle = ({
  latitude,
  longitude,
  lengthLatitude = 100, // in meters
  lengthLongitude = 100, // in meters
  offsetNorth = 0, // in meters
  offsetEast = 0, // in meters
}) => {
  // 1. Convert middlePoint to a Turf.js Point (GeoJSON convention: [longitude, latitude])
  const middlePointTurf = turfPoint([longitude, latitude])

  // Convert distances from meters to kilometers for turf.destination
  const totalLengthLatitudeKm = lengthLatitude / 1000
  const totalLengthLongitudeKm = lengthLongitude / 1000
  const offsetNorthKm = offsetNorth / 1000
  const offsetEastKm = offsetEast / 1000

  // 2. Calculate northPoint
  // bearing 0 is North
  const northPointTurf = turfDestination(
    middlePointTurf,
    totalLengthLatitudeKm / 2 + offsetNorthKm,
    0, // Bearing 0 degrees for North
    { units: 'kilometers' }
  )

  // 3. Calculate southPoint
  // bearing 180 is South
  const southPointTurf = turfDestination(
    middlePointTurf,
    totalLengthLatitudeKm / 2 - offsetNorthKm,
    180, // Bearing 180 degrees for South
    { units: 'kilometers' }
  )

  // Extract coordinates for clarity for the next steps
  const northPointCoords = northPointTurf.geometry.coordinates
  const southPointCoords = southPointTurf.geometry.coordinates

  // 4. Calculate northeastCorner
  // Start from northPoint, bearing 90 is East
  const northeastCornerTurf = turfDestination(
    turfPoint(northPointCoords), // Create a new point from coordinates
    totalLengthLongitudeKm / 2 + offsetEastKm,
    90, // Bearing 90 degrees for East
    { units: 'kilometers' }
  )

  // 5. Calculate southwestCorner
  // Start from southPoint, bearing 270 is West
  const southwestCornerTurf = turfDestination(
    turfPoint(southPointCoords), // Create a new point from coordinates
    totalLengthLongitudeKm / 2 - offsetEastKm,
    270, // Bearing 270 degrees for West
    { units: 'kilometers' }
  )

  // Extract final coordinates for the bounds
  const neLng = northeastCornerTurf.geometry.coordinates[0]
  const neLat = northeastCornerTurf.geometry.coordinates[1]
  const swLng = southwestCornerTurf.geometry.coordinates[0]
  const swLat = southwestCornerTurf.geometry.coordinates[1]

  // 6. Return the bounds.
  // Turf.js represents bounds as a BBox array: [minX, minY, maxX, maxY]
  // which is [west_longitude, south_latitude, east_longitude, north_latitude]
  const bounds = [swLng, swLat, neLng, neLat]

  const rectanglePolygon = turfBboxPolygon(bounds)

  return rectanglePolygon
}

const circle = ({
  latitude,
  longitude,
  radius,
  units = 'meters', // Default to meters
  steps = 32, // Default precision
}) => {
  const centerPoint = turfPoint([longitude, latitude])
  const options = {
    steps,
    units,
    properties: {
      name: 'Circle Polygon',
      radius,
      units,
    },
  }
  return turfCircle(centerPoint, radius, options)
}

const featureCollection = ({ features }) => ({
  type: 'FeatureCollection',
  features,
})

const setFeatureName = ({ feature, name }) =>
  Objects.setInPath({ obj: feature, path: ['properties', 'name'], value: name })

export const GeoJsonUtils = {
  area,
  bboxPolygon,
  centroidFeature,
  centroidPoint,
  countVertices,
  createPointFeature,
  parse,
  perimeterInKm: length,
  pointFeatureToPoint,
  validateFeature,
  rectangle,
  circle,
  featureCollection,
  setFeatureName,
}
