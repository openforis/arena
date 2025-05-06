import * as Survey from '@core/survey/survey'

import * as CategoryRepository from '../repository/categoryRepository.js'

const getCategoryItemByCodePaths = async ({ survey, categoryUuid, codePaths }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchCategoryItemByCodePaths({ surveyId, categoryUuid, codePaths })
}

export const CategoryItemProviderDefault = {
  getCategoryItemByCodePaths,
}
