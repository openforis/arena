import type { ArenaAnyNodeDef, ArenaSurvey } from '@openforis/arena-core'

import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { db, DbClient } from '@server/db/db'
import * as CategoryRepository from '../repository/categoryRepository'

const getItemByCodePaths = ({
  survey,
  categoryUuid,
  codePaths,
  draft = false,
  client = db,
}: {
  survey: ArenaSurvey
  categoryUuid: string
  codePaths: string[]
  draft?: boolean
  client?: DbClient
}) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCodePaths({ surveyId, categoryUuid, codePaths, draft }, client)
}

const getItemByCode = ({
  survey,
  categoryUuid,
  parentItemUuid = null,
  code,
  draft = false,
  client = db,
}: {
  survey: ArenaSurvey
  categoryUuid: string
  parentItemUuid?: string
  code: string
  draft?: boolean
  client?: DbClient
}) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByCode({ surveyId, categoryUuid, parentItemUuid, code, draft }, client)
}

const getItemByUuid = ({
  survey,
  categoryUuid: _categoryUuid,
  itemUuid,
  draft = false,
  client = db,
}: {
  survey: ArenaSurvey
  categoryUuid: string
  itemUuid: string
  draft?: boolean
  client?: DbClient
}) => {
  const surveyId = Survey.getId(survey)
  return CategoryRepository.fetchItemByUuid({ surveyId, uuid: itemUuid, draft }, client)
}

/**
 * Gets a category item from the survey ref data or, for big categories (not in the ref data), from the database.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.nodeDef - The code node definition.
 * @param {string} params.itemUuid - The category item uuid.
 * @returns {Promise<object|null>} - The category item, or null if not found.
 */
const getOrFetchItem = ({
  survey,
  nodeDef,
  itemUuid,
}: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  itemUuid: string
}) => {
  const itemInSurvey = Survey.getCategoryItemByUuid(itemUuid)(survey)
  if (itemInSurvey) {
    return Promise.resolve(itemInSurvey)
  }
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  if (!Category.isBigCategory(category)) {
    return Promise.resolve(null)
  }
  return getItemByUuid({ survey, categoryUuid, itemUuid })
}

const getItems = ({
  survey,
  categoryUuid,
  parentItemUuid = null,
  draft = false,
  client = db,
}: {
  survey: ArenaSurvey
  categoryUuid: string
  parentItemUuid?: string
  draft?: boolean
  client?: DbClient
}) => {
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
