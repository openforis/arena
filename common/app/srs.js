import * as R from 'ramda'

import codes from '@esri/proj-codes'

const projected = require('@esri/proj-codes/projected.json')

//TODO move to StringUtils module
const contains = (a = '', b = '') => R.contains(R.toLower(a), R.toLower(b))

const formatName = (name = '') => R.replace(/_/g, ' ')(name)

const srs = R.pipe(
  R.mapObjIndexed((value, key, obj) => {return {key, value: formatName(value.name)}}),
  R.values,
  R.sortBy(R.prop('value'))
)(projected)

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

const getSrsName = (code) => lookupSrs(code).name

const lookupSrs = (code) => {
  const item = codes.lookup(code)
  return {code, name: formatName(item.name), wkt: item.wkt}
}

module.exports = {
  srs,
  findSrs,
  lookupSrs,
  getSrsName,
}
