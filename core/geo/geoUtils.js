/**
 * DO NOT INCLUDE this module in the client side code.
 *
 * This module uses @esri/proj-codes library and stores all the Spatial Reference Systems (with code, name and wkt)
 * into an array that can be huge.
 */
import * as R from 'ramda'
/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}
 */
import * as projected from '@esri/proj-codes/pe_list_projcs.json'
/**
 * Geographic coordinate reference systems
 * format: same as projected
 */
import * as geographic from '@esri/proj-codes/pe_list_geogcs.json'
import proj4 from 'proj4'
import * as isValidCoordinates from 'is-valid-coordinates'

import * as ObjectUtils from '@core/objectUtils'
import * as NumberUtils from '@core/numberUtils'
import * as StringUtils from '@core/stringUtils'
import * as Srs from './srs'

const invalidLonLatCoordinates = [0, 90] // Proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}
 */
const srsArray = R.pipe(
  R.concat(projected.ProjectedCoordinateSystems),
  R.concat(geographic.GeographicCoordinateSystems),
  R.map((item) => Srs.newSrs(item.wkid.toString(), formatName(item.name), item.wkt)),
  R.sortBy(R.prop(Srs.keys.name))
)([])

const srsByCode = ObjectUtils.toIndexedObj(srsArray, Srs.keys.code)

/**
 * Finds a list of srs whose name or code matches the specified parameter
 */
export const findSrsByCodeOrName = (codeOrName, limit = 200) =>
  R.pipe(
    R.filter((item) => StringUtils.contains(codeOrName, item.code) || StringUtils.contains(codeOrName, item.name)),
    R.take(limit)
  )(srsArray)

const getSrsByCode = (code) => srsByCode[code]

export const isCoordinateValid = (srsCode, x, y) => {
  const srs = getSrsByCode(srsCode)

  if (!srs || !NumberUtils.isFloat(x) || !NumberUtils.isFloat(y)) {
    return false
  }

  x = NumberUtils.toNumber(x)
  y = NumberUtils.toNumber(y)

  const lonLat = Srs.isLatLon(srsCode)
    ? [x, y] // SRS is lat-lon, projection is not needed
    : proj4(
        Srs.getWkt(srs), // From srs
        Srs.getWkt(Srs.latLonSrs), // To lat lon
        [x, y] // Coordinates
      )

  return !R.equals(lonLat, invalidLonLatCoordinates) && isValidCoordinates(lonLat[0], lonLat[1])
}
