import * as Survey from '@core/survey/survey'

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

export const TaxonProviderDefault = {
  getTaxonByCode,
  getTaxonByUuid,
}
