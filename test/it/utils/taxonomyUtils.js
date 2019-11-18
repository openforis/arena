import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

export const fetchTaxonomyByName = async (surveyId, name, draft = true) => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(surveyId, draft)
  return R.find(taxonomy => Taxonomy.getName(taxonomy) === name)(taxonomies)
}

export const fetchTaxonomyUuidByName = async (surveyId, name, draft = true) => {
  const taxonomy = await fetchTaxonomyByName(surveyId, name, draft)
  return Taxonomy.getUuid(taxonomy)
}


export const fetchTaxonWithVernarcularNamesByCode = async (surveyId, taxonomyUuid, code, draft = true) => {
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft)
  return R.find(taxon => Taxon.getCode(taxon) === code)(taxa)
}
