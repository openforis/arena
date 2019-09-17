const R = require('ramda')
/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}
 */
const projected = require('@esri/proj-codes/pe_list_projcs.json')
/**
 * Geographic coordinate reference systems
 * format: same as projected
 */
const geographic = require('@esri/proj-codes/pe_list_geogcs.json')
const proj4 = require('proj4')
const isValidCoordinates = require('is-valid-coordinates')

const Srs = require('./srs')
const ObjectUtils = require('../objectUtils')
const NumberUtils = require('../numberUtils')
const StringUtils = require('../stringUtils')

const invalidLonLatCoordinates = [0, 90] //proj4 returns [0,90] when a wrong coordinate is projected into lat-lon

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}
 */
const srsArray = R.pipe(
  R.concat(projected.ProjectedCoordinateSystems),
  R.concat(geographic.GeographicCoordinateSystems),
  R.map(item => Srs.newSrs(item.wkid.toString(), formatName(item.name), item.wkt)),
  R.sortBy(R.prop(Srs.keys.name))
)([])

const srsByCode = ObjectUtils.toIndexedObj(srsArray, Srs.keys.code)

/**
 * Finds a list of srs whose name or code matches the specified parameter
 */
const findSrsByCodeOrName = (codeOrName, limit = 200) =>
  R.pipe(
    R.filter(item =>
      StringUtils.contains(codeOrName, item.code) ||
      StringUtils.contains(codeOrName, item.name)
    ),
    R.take(limit)
  )(srsArray)

const getSrsByCode = code => srsByCode[code]

const isCoordinateValid = (srsCode, x, y) => {
  const srs = getSrsByCode(srsCode)

  if (!srs ||
    !NumberUtils.isFloat(x) ||
    !NumberUtils.isFloat(y)) {
    return false
  } else {
    x = NumberUtils.toNumber(x)
    y = NumberUtils.toNumber(y)

    const lonLat = Srs.isLatLon(srsCode)
      ? [x, y] // SRS is lat-lon, projection is not needed
      : proj4(
        Srs.getWkt(srs), //from srs
        Srs.getWkt(Srs.latLonSrs), //to lat lon
        [x, y] //coordinates
      )

    return !R.equals(lonLat, invalidLonLatCoordinates) &&
      isValidCoordinates(lonLat[0], lonLat[1])
  }
}

module.exports = {
  findSrsByCodeOrName,

  isCoordinateValid,
}