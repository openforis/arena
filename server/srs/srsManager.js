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

const {contains} = require('../../common/stringUtils')

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}
 */
const srs = R.pipe(
  R.concat(projected.ProjectedCoordinateSystems),
  R.concat(geographic.GeographicCoordinateSystems),
  R.map(item => ({code: item.wkid.toString(), name: formatName(item.name)})),
  R.sortBy(R.prop('name'))
)([])

/**
 * Finds a list of srs whose name or code matches the specified parameter
 */
const findSrsByCodeOrName = (codeOrName, limit = 200) =>
  R.pipe(
    R.filter(item =>
      contains(codeOrName, item.code) ||
      contains(codeOrName, item.name)
    ),
    R.take(limit)
  )(srs)

module.exports = {
  findSrsByCodeOrName
}