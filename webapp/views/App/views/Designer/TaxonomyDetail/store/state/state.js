import * as A from '@core/arena'

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
