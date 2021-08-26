import * as A from '@core/arena'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

export const keys = {
  deleted: 'deleted',
  taxonomy: 'taxonomy',
  taxaVersion: 'taxaVersion',
}

// ==== CREATE
export const create = ({ taxonomy }) => ({
  [keys.taxonomy]: taxonomy,
  [keys.taxaVersion]: 0,
})

// ==== READ
export const isDeleted = A.prop(keys.deleted)
export const getTaxonomy = A.prop(keys.taxonomy)
export const getTaxaVersion = A.prop(keys.taxaVersion)
export const isTaxonomyEmpty = (state) => {
  const taxonomy = getTaxonomy(state)
  return StringUtils.isBlank(Taxonomy.getName(taxonomy)) && A.isEmpty(Taxonomy.getDescriptions(taxonomy))
}

// ==== UPDATE
export const assocDeleted = A.assoc(keys.deleted, true)
export const assocTaxonomy = A.assoc(keys.taxonomy)
export const assocTaxaVersion = A.assoc(keys.taxaVersion)

export const assocTaxonomyProp = ({ key, value }) =>
  A.pipe(
    R.assocPath([ObjectUtils.keys.props, key], value),
    R.dissocPath([Validation.keys.validation, Validation.keys.fields, key])
  )
