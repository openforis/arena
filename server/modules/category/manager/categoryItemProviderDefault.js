import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

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

/**
 * Gets a category item from the survey ref data or, for big categories (not in the ref data), from the database.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.nodeDef - The code node definition.
 * @param {string} params.itemUuid - The category item uuid.
 * @returns {Promise<object|null>} - The category item, or null if not found.
 */
const getOrFetchItem = async ({ survey, nodeDef, itemUuid }) => {
  const itemInSurvey = Survey.getCategoryItemByUuid(itemUuid)(survey)
  if (itemInSurvey) {
    return itemInSurvey
  }
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  if (!Category.isBigCategory(category)) {
    return null
  }
  return getItemByUuid({ survey, categoryUuid, itemUuid })
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
  getOrFetchItem,
}
