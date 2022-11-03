import * as A from '@core/arena'

export const stateKey = 'taxonomies'

export const assocTaxonomy = (taxonomy) => A.assoc(taxonomy)

export const dissocTaxonomy = (taxonomyUuid) => A.dissoc(taxonomyUuid)
