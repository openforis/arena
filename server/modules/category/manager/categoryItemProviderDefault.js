import * as Survey from '@core/survey/survey'

import * as CategoryRepository from '../repository/categoryRepository'

const getItemByCodePaths = async ({ survey, categoryUuid, codePaths }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCodePaths({ surveyId, categoryUuid, codePaths })
}

const getItemByUuid = async ({ survey, categoryUuid, itemUuid }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByUuid({ surveyId, categoryUuid, uuid: itemUuid })
}

export const CategoryItemProviderDefault = {
  getItemByCodePaths,
  getItemByUuid,
}
