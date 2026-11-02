import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'

import * as TaxonomyRepository from '../repository/taxonomyRepository'

const getTaxonByCode = async ({ survey, taxonomyUuid, taxonCode, draft = false }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByCode({
    surveyId,
    taxonomyUuid,
    taxonCode,
    draft,
  })
}

const getTaxonByUuid = async ({ survey, taxonomyUuid, taxonUuid, draft = false }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByUuid({ surveyId, taxonomyUuid, taxonUuid, draft })
}

/**
 * Gets a taxon from the survey ref data or, for big taxonomies (not in the ref data), from the database.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.nodeDef - The taxon node definition.
 * @param {string} params.taxonUuid - The taxon uuid.
 * @returns {Promise<object|null>} - The taxon, or null if not found.
 */
const getOrFetchTaxon = async ({ survey, nodeDef, taxonUuid }) => {
  const taxonInSurvey = Survey.getTaxonByUuid(taxonUuid)(survey)
  if (taxonInSurvey) {
    return taxonInSurvey
  }
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxonomy = Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
  if (!Taxonomy.isBigTaxonomy(taxonomy)) {
    return null
  }
  return getTaxonByUuid({ survey, taxonomyUuid, taxonUuid })
}

export const TaxonProviderDefault = {
  getTaxonByCode,
  getTaxonByUuid,
  getOrFetchTaxon,
}
