import GeometryUtil from 'leaflet-geometryutil'
import L from 'leaflet'

const { destination } = GeometryUtil

const degreesToRadians = (degrees) => (Math.PI * degrees) / 180

//https://stackoverflow.com/a/39540339/13745527
const metersToDegreesLatitude = (meters) => {
  return meters / (111.32 * 1000)
}
const metersToDegreesLongitude = (meters, lat) => {
  return meters / ((40075 * 1000 * Math.cos(degreesToRadians(lat))) / 360)
}

const generateBounds = ({
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

export const GeoUtils = {
  metersToDegreesLatitude,
  metersToDegreesLongitude,
  destination,
  generateBounds,
}
