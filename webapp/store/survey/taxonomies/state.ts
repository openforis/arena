import * as A from '@core/arena'
import * as Taxonomy from '@core/survey/taxonomy'

export const stateKey = 'taxonomies'

export const assocTaxonomy = (taxonomy) => A.assoc(Taxonomy.getUuid(taxonomy), taxonomy)

export const dissocTaxonomy = (taxonomyUuid) => A.dissoc(taxonomyUuid)
