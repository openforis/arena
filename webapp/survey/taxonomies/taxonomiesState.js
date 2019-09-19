import * as R from 'ramda'

import Taxonomy from '../../../common/survey/taxonomy'
import Validation from '../../../common/validation/validation'

export const assocTaxonomy = taxonomy => R.assoc(Taxonomy.getUuid(taxonomy), taxonomy)

export const dissocTaxonomy = taxonomy => R.dissoc(Taxonomy.getUuid(taxonomy))

export const assocTaxonomyProp = (taxonomy, key, value) => R.pipe(
  R.assocPath([Taxonomy.getUuid(taxonomy), SurveyUtils.keys.props, key], value),
  R.dissocPath([Taxonomy.getUuid(taxonomy), Validation.keys.validation, Validation.keys.fields, key]),
)
