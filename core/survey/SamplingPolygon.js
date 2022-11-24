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

export const getBounds = (surveyInfo, latitude, longitude) => {
    const len_lat_meters = getLengthLatitude(surveyInfo)
    const len_lng_meters = getLengthLongitude(surveyInfo)
    const offset_north_meters = getOffsetNorth(surveyInfo)
    const offset_east_meters = getOffsetEast(surveyInfo)
    const middle_latlng = L.latLng(latitude, longitude)
    const north_point = GeometryUtil.destination(middle_latlng, 0, len_lat_meters / 2 + offset_north_meters)
    const south_point = GeometryUtil.destination(middle_latlng, 180, len_lat_meters / 2 - offset_north_meters)
    const northeast_corner = GeometryUtil.destination(north_point, 90, len_lng_meters / 2 + offset_east_meters)
    const southwest_corner = GeometryUtil.destination(south_point, 270, len_lng_meters / 2 - offset_east_meters)
    const bounds = L.latLngBounds(southwest_corner, northeast_corner)
    return bounds
}


//https://stackoverflow.com/a/39540339/13745527
export const MetersToDegreesLatitude = (meters) => {
    return meters / (111.32 * 1000)
  }
export const MetersToDegreesLongitude = (meters, lat) => {
    return meters / ((40075 * 1000 * Math.cos((Math.PI * lat) / 180)) / 360)
  }


