import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

export const assocTaxonomy = taxonomy =>
  R.assoc(Taxonomy.getUuid(taxonomy), taxonomy)

export const dissocTaxonomy = taxonomy => R.dissoc(Taxonomy.getUuid(taxonomy))

export const assocTaxonomyProp = (taxonomy, key, value) =>
  R.pipe(
    R.assocPath(
      [Taxonomy.getUuid(taxonomy), ObjectUtils.keys.props, key],
      value,
    ),
    R.dissocPath([
      Taxonomy.getUuid(taxonomy),
      Validation.keys.validation,
      Validation.keys.fields,
      key,
    ]),
  )
