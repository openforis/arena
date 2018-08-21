const R = require('ramda')
const codes = require('@esri/proj-codes')
/**
 * Projected coordinate reference systems indexed by EPSG code
 * format: {epgsCode: {name:"CRS name", wkt: "Well Know Text"}}
 */
const projected = require('@esri/proj-codes/projected.json')
/**
 * Geographic coordinate reference systems indexed by EPSG code
 * format: same as projected
 */
const geographic = require('@esri/proj-codes/geographic.json') //geographic coordinate reference systems

//TODO move to StringUtils module
const contains = (a = '', b = '') => R.contains(R.toLower(a), R.toLower(b))

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {key: epsgCode, value: "Formatted coordinate reference system name"}
 */
const srs = R.pipe(
  R.merge(geographic),
  R.mapObjIndexed((value, key, obj) => {return {key, value: formatName(value.name)}}),
  R.values,
  R.sortBy(R.prop('value'))
)(projected)

/**
 * Finds a list of srs whose name or code matches the specified parameter
 * @param codeOrName
 * @returns {Array}
 */
const findSrs = (codeOrName) => {
  const matchingItems = []

  R.forEachObjIndexed((item, key) => {
    const formattedName = formatName(item.name)
    if (contains(codeOrName, formattedName) || contains(codeOrName, key)) {
      matchingItems.push({key, value: formattedName})
    }
  })(projected)

  return matchingItems
}

/**
 * Returns the name of a srs having the specified EPSG code
 * @param code
 * @returns string
 */
const getSrsName = (code) => lookupSrs(code).name

/**
 * returns a srs having the specified EPSG code
 * @param code
 * @returns {{code: number, name: string, wkt: string}}
 */
const lookupSrs = (code) => {
  const item = codes.lookup(code)
  return {code, name: formatName(item.name), wkt: item.wkt}
}

const toSrsItems = (codes) => R.filter(srsItem => R.contains(srsItem.key, codes))(srs)

module.exports = {
  srs,
  findSrs,
  lookupSrs,
  getSrsName,
  toSrsItems,
}
