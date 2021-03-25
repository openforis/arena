/**
 * DO NOT INCLUDE this module in the client side code.
 *
 * This module uses @esri/proj-codes library and stores all the Spatial Reference Systems (with code, name and wkt)
 * into an array that can be huge.
 */
import * as R from 'ramda'
/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}.
 */
import * as projected from '@esri/proj-codes/pe_list_projcs.json'
/**
 * Geographic coordinate reference systems
 * format: same as projected.
 */
import * as geographic from '@esri/proj-codes/pe_list_geogcs.json'
import proj4 from 'proj4'
import * as isValidCoordinates from 'is-valid-coordinates'

import * as ObjectUtils from '@core/objectUtils'
import * as NumberUtils from '@core/numberUtils'
import * as StringUtils from '@core/stringUtils'
import * as Srs from './srs'
import * as Point from './point'

const invalidLatLongPoint = Point.newPoint({ srs: Srs.latLongSrsCode, x: 0, y: 90 }) // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}.
 */
const srsArray = R.pipe(
  R.concat(projected.ProjectedCoordinateSystems),
  R.concat(geographic.GeographicCoordinateSystems),
  R.map((item) => Srs.newSrs(item.wkid.toString(), formatName(item.name), item.wkt)),
  R.sortBy(R.prop(Srs.keys.name))
)([])

const srsByCode = ObjectUtils.toIndexedObj(srsArray, Srs.keys.code)

/**
 * Finds a list of srs whose name or code matches the specified parameter.
 *
 * @param {!string} codeOrName - Code or name of the SRS to find.
 * @param {number} limit - Maximum number of items to return.
 * @returns {object[]} - List of SRS matching the specified code or name.
 */
export const findSrsByCodeOrName = (codeOrName, limit = 200) =>
  R.pipe(
    R.filter((item) => StringUtils.contains(codeOrName, item.code) || StringUtils.contains(codeOrName, item.name)),
    R.take(limit)
  )(srsArray)

const getSrsByCode = (code) => srsByCode[code]

const toLatLong = (point) => {
  if (!Point.isFilled(point)) return null

  const srsId = Point.getSrs(point)
  if (Srs.isLatLong(srsId)) {
    // projection is not needed
    return point
  }
  const x = Point.getX(point)
  const y = Point.getY(point)

  const srsFrom = getSrsByCode(srsId)
  const srsTo = Srs.latLonSrs

  const [long, lat] = proj4(
    Srs.getWkt(srsFrom),
    Srs.getWkt(srsTo), // To srs
    [x, y] // Coordinates
  )
  return Point.newPoint({ srs: Srs.latLongSrsCode, x: long, y: lat })
}

export const isCoordinateValid = (srsCode, x, y) => {
  const srs = getSrsByCode(srsCode)

  if (!srs || !NumberUtils.isFloat(x) || !NumberUtils.isFloat(y)) {
    return false
  }

  const pointLatLong = toLatLong(
    Point.newPoint({ srs: srsCode, x: NumberUtils.toNumber(x), y: NumberUtils.toNumber(y) })
  )
  return (
    !R.equals(pointLatLong, invalidLatLongPoint) &&
    isValidCoordinates(Point.getX(pointLatLong), Point.getY(pointLatLong))
  )
}

/**
 * Takes two points and returns the distance between them as the crow flies (in meters).
 *
 * @param {!object} pointFrom - Start point.
 * @param {!object} pointTo - End point.
 * @returns {number} - Distance between the specified points in meters.
 */
export const distance = (pointFrom, pointTo) => {
  const point1LatLong = toLatLong(pointFrom)
  const point2LatLong = toLatLong(pointTo)

  if (!point1LatLong || !point2LatLong) return null

  const toRad = (value) => (value * Math.PI) / 180

  const long1 = Point.getX(point1LatLong)
  const lat1 = Point.getY(point1LatLong)
  const long2 = Point.getX(point2LatLong)
  const lat2 = Point.getY(point2LatLong)

  const earthRadius = 6371000 // Earth radius in meters
  const distanceLat = toRad(lat2 - lat1)
  const distanceLong = toRad(long2 - long1)
  const lat1Rad = toRad(lat1)
  const lat2Rad = toRad(lat2)

  const a = Math.sin(distanceLat / 2) ** 2 + Math.sin(distanceLong / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}
