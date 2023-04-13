import * as Survey from '@core/survey/survey'
import GeometryUtil from 'leaflet-geometryutil'
import L from 'leaflet'

export const getLengthLatitude = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).lengthLatitude || 0
}

export const getLengthLongitude = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).lengthLongitude || 0
}

export const getOffsetNorth = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).offsetNorth || 0
}

export const getOffsetEast = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).offsetEast || 0
}

export const getNumberOfPointsNorth = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).numberOfPointsNorth || 0
}

export const getNumberOfPointsEast = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).numberOfPointsEast || 0
}

export const getNumberOfPointsCircle = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).numberOfPointsCircle || 0
}

export const getControlPointOffsetNorth = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).controlPointOffsetNorth || 0
}

export const getControlPointOffsetEast = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).controlPointOffsetEast || 0
}

export const getRadius = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).radius || 0
}

export const getIsCircle = (surveyInfo) => {
  return Survey.getSamplingPolygon(surveyInfo).isCircle || false
}

export const generateBounds = ({
  latitude,
  longitude,
  lengthLatitude = 100,
  lengthLongitude = 100,
  offsetNorth = 0,
  offsetEast = 0,
}) => {
  const middlePoint = L.latLng(latitude, longitude)
  const northPoint = GeometryUtil.destination(middlePoint, 0, lengthLatitude / 2 + offsetNorth)
  const southPoint = GeometryUtil.destination(middlePoint, 180, lengthLatitude / 2 - offsetNorth)
  const northeastCorner = GeometryUtil.destination(northPoint, 90, lengthLongitude / 2 + offsetEast)
  const southwestCorner = GeometryUtil.destination(southPoint, 270, lengthLongitude / 2 - offsetEast)
  const bounds = L.latLngBounds(southwestCorner, northeastCorner)
  return bounds
}

export const getBounds = (surveyInfo, latitude, longitude) =>
  generateBounds({
    latitude,
    longitude,
    lengthLatitude: getLengthLatitude(surveyInfo),
    lengthLongitude: getLengthLongitude(surveyInfo),
    offsetEast: getOffsetEast(surveyInfo),
    offsetNorth: getOffsetNorth(surveyInfo),
  })

//https://stackoverflow.com/a/39540339/13745527
export const MetersToDegreesLatitude = (meters) => {
  return meters / (111.32 * 1000)
}
export const MetersToDegreesLongitude = (meters, lat) => {
  return meters / ((40075 * 1000 * Math.cos((Math.PI * lat) / 180)) / 360)
}
