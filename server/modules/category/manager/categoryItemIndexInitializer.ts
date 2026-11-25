import { type ArenaCategory, type ArenaCategoryItem, Objects } from '@openforis/arena-core'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'
import { db, DbClient } from '@server/db/db'
import * as CategoryRepository from '../repository/categoryRepository'

const shouldItemIndexBeInitialized = (item: ArenaCategoryItem) => item && Objects.isEmpty(CategoryItem.getIndex(item))

const isIndexable = ({ item, draft }: { item: ArenaCategoryItem; draft: boolean }) =>
  (draft && CategoryItem.isDraft(item)) || (!draft && CategoryItem.isPublished(item))

const itemsSortFunction = (itemA: ArenaCategoryItem, itemB: ArenaCategoryItem) => {
  const indexA = CategoryItem.getIndex(itemA)
  const indexB = CategoryItem.getIndex(itemB)

  const hasIndexA = !Number.isNaN(indexA)
  const hasIndexB = !Number.isNaN(indexB)

  // 1. Prioritize items with a defined index over those without.
  // (a) If A has index and B doesn't, A comes first (return -1).
  if (hasIndexA && !hasIndexB) {
    return -1
  }
  // (b) If B has index and A doesn't, B comes first (return 1).
  if (!hasIndexA && hasIndexB) {
    return 1
  }
  // 2. If both or neither have an index, proceed with secondary sorting.
  if (hasIndexA && hasIndexB) {
    // Both have an index: sort by index (ascending).
    // If indices are equal, fall through to ID comparison (step 3).
    if (indexA !== indexB) {
      // Assumes index is a number.
      return indexA - indexB
    }
  }
  // 3. If indices are equal (or both are undefined), sort by ID (ascending).
  return CategoryItem.getId(itemA) - CategoryItem.getId(itemB)
}

const calculateIndexesByItemUuid = ({
  itemsByParentUuid,
  draft,
}: {
  itemsByParentUuid: Record<string, any>
  draft: boolean
}) => {
  const indexByItemUuid = {}

  for (const groupItems of Object.values(itemsByParentUuid)) {
    // Sort by index or default to ID to maintain consistent ordering
    const sortedItems = groupItems.sort(itemsSortFunction)

    for (let index = 0; index < sortedItems.length; index++) {
      const item = sortedItems[index]
      if (isIndexable({ item, draft })) {
        indexByItemUuid[CategoryItem.getUuid(item)] = index
      }
    }
  }
  return indexByItemUuid
}

const groupItemsByParentUuid = (items: ArenaCategoryItem[]) => {
  const itemsByParentUuid = {}
  let shouldIndexesBeInitialized = false
  for (const item of items) {
    shouldIndexesBeInitialized = shouldIndexesBeInitialized || shouldItemIndexBeInitialized(item)
    const parentUuidKey = String(CategoryItem.getParentUuid(item))
    itemsByParentUuid[parentUuidKey] ??= []
    itemsByParentUuid[parentUuidKey].push(item)
  }
  return { shouldIndexesBeInitialized, itemsByParentUuid }
}

const _initializeSurveyCategoryItemsIndexesInternal = async (
  { surveyId, category, draft = true }: { surveyId: number; category: ArenaCategory; draft?: boolean },
  client: DbClient = db
) => {
  const categoryUuid = Category.getUuid(category)
  const levels = Category.getLevelsArray(category)

  for (const level of levels) {
    const levelIndex = CategoryLevel.getIndex(level)

    const items = await CategoryRepository.fetchItemsByLevelIndex({ surveyId, categoryUuid, levelIndex, draft }, client) // NOSONAR
    const { shouldIndexesBeInitialized, itemsByParentUuid } = groupItemsByParentUuid(items)
    if (shouldIndexesBeInitialized) {
      const indexByItemUuid = calculateIndexesByItemUuid({ itemsByParentUuid, draft })

      if (Objects.isNotEmpty(indexByItemUuid)) {
        await CategoryRepository.updateItemsIndexes({ surveyId, indexByItemUuid, draftProps: draft }, client) // NOSONAR
      }
    }
  }
}

export const initializeSurveyCategoryItemsIndexes = async (
  { surveyId, category }: { surveyId: number; category: ArenaCategory },
  client: DbClient = db
) => {
  if (Category.isPublished(category)) {
    await _initializeSurveyCategoryItemsIndexesInternal({ surveyId, category, draft: false }, client)
  }
  await _initializeSurveyCategoryItemsIndexesInternal({ surveyId, category, draft: true }, client)
}

/**
 * Initializes (fixes) the item indexes of every category in a single survey, in one transaction.
 * @param {object} params - The parameters object.
 * @param {number} params.surveyId - The survey id.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<void>} - A promise resolving to void.
 */
export const initializeCategoryItemIndexesForSurvey = async (
  { surveyId }: { surveyId: number },
  client: DbClient = db
) => {
  await client.tx(async (t) => {
    const categoriesByUuid = await CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true }, t)

    for (const category of Object.values(categoriesByUuid)) {
      await initializeSurveyCategoryItemsIndexes({ surveyId, category }, t) // NOSONAR
    }
  })
}
