import * as Survey from '@core/survey/survey'

import * as TaxonomyRepository from '../repository/taxonomyRepository'

const getTaxonByCode = async ({ survey, taxonomyUuid, code }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByCode({ surveyId, taxonomyUuid, code })
}

const getTaxonByUuid = async ({ survey, taxonomyUuid, taxonUuid }) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByUuid({ surveyId, taxonomyUuid, taxonUuid })
}

export const TaxonProviderDefault = {
  getTaxonByCode,
  getTaxonByUuid,
}
