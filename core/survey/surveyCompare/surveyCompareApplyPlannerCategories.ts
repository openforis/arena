import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import { SurveyCompareCategoryDiff, SurveyCompareParams, SurveyCompareStatus } from './surveyCompareTypes'
import { getExtraTargetLevels, indexItemsByCodePath, updatableCategoryProps } from './surveyCompareCategories'

export interface CategoriesApplyPlan {
  categoriesToInsert: { category: any; items: any[] }[]
  categoryPropsToUpdate: { categoryUuid: string; key: string; value: any }[]
  categoryLevelsToInsert: any[]
  categoryLevelPropsToUpdate: { categoryUuid: string; levelUuid: string; key: string; value: any }[]
  categoryItemsToInsert: { categoryUuid: string; items: any[] }[]
  categoryItemsToUpdate: { categoryUuid: string; items: any[] }[]
  categoryItemsToDelete: { categoryUuid: string; itemUuids: string[] }[]
  categoryLevelsToDelete: { categoryUuid: string; levelUuid: string }[]
  categoryUuidsToDelete: string[]
}

export const newCategoriesApplyPlan = (): CategoriesApplyPlan => ({
  categoriesToInsert: [],
  categoryPropsToUpdate: [],
  categoryLevelsToInsert: [],
  categoryLevelPropsToUpdate: [],
  categoryItemsToInsert: [],
  categoryItemsToUpdate: [],
  categoryItemsToDelete: [],
  categoryLevelsToDelete: [],
  categoryUuidsToDelete: [],
})

const planCategoryInsert = ({ params, diff, plan }) => {
  const category = Survey.getCategoryByUuid(diff.sourceUuid)(params.sourceSurvey)
  const categoryUuid = Category.getUuid(category)
  const levels = Category.getLevelsArray(category).map(CategoryLevel.assocCategoryUuid(categoryUuid))
  plan.categoriesToInsert.push({
    category: Category.assocLevelsArray(levels)(category),
    items: params.sourceItemsByCategoryUuid[categoryUuid] ?? [],
  })
}

// levels are renamed or added at the end; returns the levels of the target category after the update
const planLevelsChanges = ({ sourceCategory, targetCategory, plan }): any[] => {
  const categoryUuid = Category.getUuid(targetCategory)
  const targetLevels = Category.getLevelsArray(targetCategory)
  const targetLevelUuids = new Set(targetLevels.map(CategoryLevel.getUuid))
  const levels = [...targetLevels]
  for (const [index, sourceLevel] of Category.getLevelsArray(sourceCategory).entries()) {
    const name = CategoryLevel.getName(sourceLevel)
    const targetLevel = targetLevels[index]
    if (!targetLevel) {
      const sourceLevelUuid = CategoryLevel.getUuid(sourceLevel)
      const level = {
        uuid: targetLevelUuids.has(sourceLevelUuid) ? uuidv4() : sourceLevelUuid,
        categoryUuid,
        index,
        props: { [CategoryLevel.keysProps.name]: name },
      }
      plan.categoryLevelsToInsert.push(level)
      levels.push(level)
    } else if (CategoryLevel.getName(targetLevel) !== name) {
      plan.categoryLevelPropsToUpdate.push({
        categoryUuid,
        levelUuid: CategoryLevel.getUuid(targetLevel),
        key: CategoryLevel.keysProps.name,
        value: name,
      })
    }
  }
  return levels
}

const sortByCodePathLength = <T extends { codePath: string[] }>(entries: T[]): T[] =>
  [...entries].sort((entryA, entryB) => entryA.codePath.length - entryB.codePath.length)

const planCategoryItemsChanges = ({
  params,
  diff,
  plan,
  targetCategory,
  levels,
}: {
  params: SurveyCompareParams
  diff: SurveyCompareCategoryDiff
  plan: CategoriesApplyPlan
  targetCategory: any
  levels: any[]
}) => {
  const targetItems = params.targetItemsByCategoryUuid[diff.targetUuid] ?? []
  const sourceIndex = indexItemsByCodePath(params.sourceItemsByCategoryUuid[diff.sourceUuid])
  const targetIndex = indexItemsByCodePath(targetItems)
  const targetItemUuids = new Set(targetItems.map(CategoryItem.getUuid))
  const itemUuidByCodePathKey = Object.fromEntries(
    Object.entries(targetIndex).map(([key, { item }]) => [key, CategoryItem.getUuid(item)])
  )
  const itemsToInsert = []
  const itemsToUpdate = []
  for (const { codePath, status } of sortByCodePathLength(diff.items)) {
    const key = JSON.stringify(codePath)
    const sourceItem = sourceIndex[key]?.item
    if (status === SurveyCompareStatus.added) {
      const sourceItemUuid = CategoryItem.getUuid(sourceItem)
      const uuid = targetItemUuids.has(sourceItemUuid) ? uuidv4() : sourceItemUuid
      const parentKey = codePath.length > 1 ? JSON.stringify(codePath.slice(0, -1)) : null
      itemUuidByCodePathKey[key] = uuid
      itemsToInsert.push({
        ...sourceItem,
        uuid,
        levelUuid: CategoryLevel.getUuid(levels[codePath.length - 1]),
        parentUuid: parentKey ? itemUuidByCodePathKey[parentKey] : null,
      })
    } else if (status === SurveyCompareStatus.changed) {
      const targetItem = targetIndex[key].item
      itemsToUpdate.push({
        ...targetItem,
        props: { ...CategoryItem.getProps(sourceItem), index: CategoryItem.getIndex(targetItem) },
      })
    }
  }
  const categoryUuid = Category.getUuid(targetCategory)
  if (itemsToInsert.length > 0) plan.categoryItemsToInsert.push({ categoryUuid, items: itemsToInsert })
  if (itemsToUpdate.length > 0) plan.categoryItemsToUpdate.push({ categoryUuid, items: itemsToUpdate })
}

const planCategoryUpdate = ({ params, diff, plan }) => {
  const sourceCategory = Survey.getCategoryByUuid(diff.sourceUuid)(params.sourceSurvey)
  const targetCategory = Survey.getCategoryByUuid(diff.targetUuid)(params.targetSurvey)
  for (const { key } of diff.propDiffs) {
    if (updatableCategoryProps.includes(key)) {
      plan.categoryPropsToUpdate.push({
        categoryUuid: diff.targetUuid,
        key,
        value: Category.getProps(sourceCategory)[key] ?? null,
      })
    }
  }
  const levels = planLevelsChanges({ sourceCategory, targetCategory, plan })
  planCategoryItemsChanges({ params, diff, plan, targetCategory, levels })
}

// deletes the unpublished items and levels only in the target category
const planCategoryRemoval = ({ params, diff, plan }) => {
  const sourceCategory = Survey.getCategoryByUuid(diff.sourceUuid)(params.sourceSurvey)
  const targetCategory = Survey.getCategoryByUuid(diff.targetUuid)(params.targetSurvey)
  const targetIndex = indexItemsByCodePath(params.targetItemsByCategoryUuid[diff.targetUuid])
  const itemUuids = diff.items
    .filter((item) => item.status === SurveyCompareStatus.removed && !item.published)
    .map((item) => CategoryItem.getUuid(targetIndex[JSON.stringify(item.codePath)].item))
  if (itemUuids.length > 0) {
    plan.categoryItemsToDelete.push({ categoryUuid: diff.targetUuid, itemUuids })
  }
  const { deletable } = getExtraTargetLevels({ source: sourceCategory, target: targetCategory })
  // deeper levels first
  for (const level of [...deletable].reverse()) {
    plan.categoryLevelsToDelete.push({ categoryUuid: diff.targetUuid, levelUuid: CategoryLevel.getUuid(level) })
  }
}

/**
 * Builds the changes to the categories needed to apply the selected changes.
 * @param {object} params - The parameters.
 * @param {SurveyCompareParams} params.params - Comparison parameters.
 * @param {SurveyCompareCategoryDiff[]} params.diffs - Category diffs.
 * @param {Set<string>} params.appliedIds - Ids of the changes to apply.
 * @param {CategoriesApplyPlan} params.plan - The plan to fill.
 * @returns {void}
 */
export const planCategories = ({
  params,
  diffs,
  appliedIds,
  plan,
}: {
  params: SurveyCompareParams
  diffs: SurveyCompareCategoryDiff[]
  appliedIds: Set<string>
  plan: CategoriesApplyPlan
}): void => {
  for (const diff of diffs) {
    if (appliedIds.has(diff.id)) {
      if (diff.status === SurveyCompareStatus.added) {
        planCategoryInsert({ params, diff, plan })
      } else if (diff.status === SurveyCompareStatus.changed) {
        planCategoryUpdate({ params, diff, plan })
      } else if (diff.status === SurveyCompareStatus.removed) {
        plan.categoryUuidsToDelete.push(diff.targetUuid)
      }
    }
    if (diff.removal && appliedIds.has(diff.removal.id)) {
      planCategoryRemoval({ params, diff, plan })
    }
  }
}
