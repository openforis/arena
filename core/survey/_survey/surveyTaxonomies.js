import * as A from '@core/arena'

import * as Taxonomy from '../taxonomy'
import * as SurveyNodeDefs from './surveyNodeDefs'

const taxonomies = 'taxonomies'

// ====== READ
export const getTaxonomies = A.propOr({}, taxonomies)

export const getTaxonomiesArray = A.pipe(getTaxonomies, Object.values)

export const getTaxonomyByUuid = (uuid) => A.pipe(getTaxonomies, A.prop(uuid))

export const getTaxonomyByName = (name) => (survey) => {
  const taxonomies = getTaxonomiesArray(survey)
  return taxonomies.find((taxonomy) => Taxonomy.getName(taxonomy) === name)
}

// ====== UPDATE
export const assocTaxonomies = (newTaxonomies) => A.assoc(taxonomies, newTaxonomies)

// ====== UTILS
export const isTaxonomyUnused = (taxonomy) => (survey) =>
  A.isEmpty(SurveyNodeDefs.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))
