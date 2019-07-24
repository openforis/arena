const R = require('ramda')

const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
}

const getRefData = R.propOr({}, keys.refData)
const getRefDataProp = key => R.pipe(getRefData, R.prop(key))

const getTaxon = getRefDataProp(keys.taxon)
const getCategoryItem = getRefDataProp(keys.categoryItem)

const assocRefData = R.assoc(keys.refData)

module.exports = {
  keys,

  getTaxon,
  getCategoryItem,

  assocRefData,
}
