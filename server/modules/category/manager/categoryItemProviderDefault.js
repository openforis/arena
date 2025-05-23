import * as Survey from '@core/survey/survey'

import * as CategoryRepository from '../repository/categoryRepository'

const getItemByCodePaths = async ({ survey, categoryUuid, codePaths, draft = false }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCodePaths({ surveyId, categoryUuid, codePaths, draft })
}

const getItemByUuid = async ({ survey, categoryUuid, itemUuid, draft = false }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByUuid({ surveyId, categoryUuid, uuid: itemUuid, draft })
}

const getItems = async ({ survey, categoryUuid, parentItemUuid = null, draft = false }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemsByParentUuid({ surveyId, categoryUuid, parentUuid: parentItemUuid, draft })
}

export const CategoryItemProviderDefault = {
  getItemByCodePaths,
  getItemByUuid,
  getItems,
}
