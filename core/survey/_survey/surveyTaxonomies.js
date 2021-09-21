import * as R from 'ramda'

import * as Taxonomy from '../taxonomy'

const taxonomies = 'taxonomies'

// ====== READ
export const getTaxonomies = R.propOr({}, taxonomies)

export const getTaxonomiesArray = R.pipe(getTaxonomies, R.values)

export const getTaxonomyByUuid = (uuid) => R.pipe(getTaxonomies, R.prop(uuid))

export const getTaxonomyByName = (name) => (survey) => {
  const taxonomies = getTaxonomiesArray(survey)
  return taxonomies.find((taxonomy) => Taxonomy.getName(taxonomy) === name)
}

// ====== UPDATE
export const assocTaxonomies = (newTaxonomies) => R.assoc(taxonomies, newTaxonomies)
