import * as R from 'ramda'

export const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
}

const getRefData = R.propOr({}, keys.refData)
const getRefDataProp = (key) => R.pipe(getRefData, R.prop(key))

export const getTaxon = getRefDataProp(keys.taxon)
export const getCategoryItem = getRefDataProp(keys.categoryItem)

export const assocRefData = R.assoc(keys.refData)
