import * as R from 'ramda'

import Taxonomy from '../../../core/survey/taxonomy'
import Validation from '../../../core/validation/validation'
import ObjectUtils from '../../../core/objectUtils'

export const assocTaxonomy = taxonomy => R.assoc(Taxonomy.getUuid(taxonomy), taxonomy)

export const dissocTaxonomy = taxonomy => R.dissoc(Taxonomy.getUuid(taxonomy))

export const assocTaxonomyProp = (taxonomy, key, value) => R.pipe(
  R.assocPath([Taxonomy.getUuid(taxonomy), ObjectUtils.keys.props, key], value),
  R.dissocPath([Taxonomy.getUuid(taxonomy), Validation.keys.validation, Validation.keys.fields, key]),
)
