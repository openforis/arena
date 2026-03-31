import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'
import * as CategoryRepository from '../repository/categoryRepository'

const getItemByCodePaths = async ({ survey, categoryUuid, codePaths, draft = false, client = db }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCodePaths({ surveyId, categoryUuid, codePaths, draft }, client)
}

const getItemByCode = async ({ survey, categoryUuid, parentItemUuid = null, code, draft = false, client = db }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCode({ surveyId, categoryUuid, parentItemUuid, code, draft }, client)
}

const getItemByUuid = async ({ survey, categoryUuid, itemUuid, draft = false, client = db }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByUuid({ surveyId, categoryUuid, uuid: itemUuid, draft }, client)
}

const getItems = async ({ survey, categoryUuid, parentItemUuid = null, draft = false, client = db }) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemsByParentUuid(
    { surveyId, categoryUuid, parentUuid: parentItemUuid, draft },
    client
  )
}

export const CategoryItemProviderDefault = {
  getItemByCodePaths,
  getItemByUuid,
  getItemByCode,
  getItems,
}
