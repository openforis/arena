import * as A from '@core/arena'

export const keys = {
  refData: 'refData',
  taxon: 'taxon',
  categoryItem: 'categoryItem',
}

const getRefData = A.propOr({}, keys.refData)
const getRefDataProp = (key) => A.pipe(getRefData, A.prop(key))

export const getTaxon = getRefDataProp(keys.taxon)
export const getCategoryItem = getRefDataProp(keys.categoryItem)

export const assocRefData = A.assoc(keys.refData)
