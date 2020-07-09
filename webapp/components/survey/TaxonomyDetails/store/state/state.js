import * as A from '@core/arena'
import * as R from 'ramda'

import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'

export const Taxonomykeys = {
  taxa: 'taxa',
  taxonomyUuid: 'taxonomyUuid',
}

export const keys = {
  taxonomy: 'taxonomy',
  taxaVersion: 'taxaVersion',
}

// ==== CREATE
export const create = ({ taxonomy }) => ({
  [keys.taxonomy]: taxonomy,
  [keys.taxaVersion]: 0,
})

// ==== READ
export const getTaxonomy = A.prop(keys.taxonomy)
export const getTaxaVersion = A.prop(keys.taxaVersion)

// ==== UPDATE
export const assocTaxonomy = A.assoc(keys.taxonomy)
export const assocTaxaVersion = A.assoc(keys.taxaVersion)

export const assocTaxonomyProp = ({ key, value }) =>
  A.pipe(
    R.assocPath([ObjectUtils.keys.props, key], value),
    R.dissocPath([Validation.keys.validation, Validation.keys.fields, key])
  )
