import * as R from 'ramda'

const taxonomies = 'taxonomies'

// ====== READ
export const getTaxonomies = R.propOr({}, taxonomies)

export const getTaxonomiesArray = R.pipe(getTaxonomies, R.values)

export const getTaxonomyByUuid = (uuid) => R.pipe(getTaxonomies, R.prop(uuid))

// ====== UPDATE
export const assocTaxonomies = (newTaxonomies) => R.assoc(taxonomies, newTaxonomies)
