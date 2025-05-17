import * as Survey from '@core/survey/survey'

import * as TaxonomyRepository from '../repository/taxonomyRepository'

const getTaxonByCode = async ({ survey, taxonomyUuid, taxonCode }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByCode({
    surveyId,
    taxonomyUuid,
    taxonCode,
    draft: true,
  })
}

const getTaxonByUuid = async ({ survey, taxonomyUuid, taxonUuid }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByUuid({ surveyId, taxonomyUuid, taxonUuid, draft: true })
}

export const TaxonProviderDefault = {
  getTaxonByCode,
  getTaxonByUuid,
}
