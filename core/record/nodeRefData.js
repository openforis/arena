import * as A from '@core/arena'

export const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
}

export const getRefData = A.prop(keys.refData)
const getRefDataOrEmpty = A.propOr({}, keys.refData)
const getRefDataProp = (key) => A.pipe(getRefDataOrEmpty, A.prop(key))

export const getTaxon = getRefDataProp(keys.taxon)
export const getCategoryItem = getRefDataProp(keys.categoryItem)

export const assocRefData = A.assoc(keys.refData)
// set to undefined instead of deleting the key: it would switch the node to the V8 dictionary mode
export const dissocRefData = A.assoc(keys.refData, undefined)
