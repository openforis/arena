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
  R.mapObjIndexed((value, key) => ({key, value: formatName(value.name)})),
  R.values,
  R.sortBy(R.prop('value'))
)(projected)

/**
 * Finds a list of srs whose name or code matches the specified parameter
 * @param codeOrName
 * @returns {Array}
 */
const find = (codeOrName) =>
  R.filter(item =>
    contains(codeOrName, item.key) ||
    contains(codeOrName, item.name)
  )(srs)

const fetchByCodes = codes => R.pipe(
  R.filter(item => R.contains(item.key, codes))
)(srs)

module.exports = {
  find,
  fetchByCodes,
}