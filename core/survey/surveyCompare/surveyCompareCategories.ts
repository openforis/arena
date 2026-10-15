import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import {
  CategoryItemsByCategoryUuid,
  SurveyCompareApplicabilityStatus,
  SurveyCompareCategoryDiff,
  SurveyCompareCategoryItemDiff,
  SurveyCompareMatchType,
  SurveyComparePropDiff,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareStatus,
} from './surveyCompareTypes'
import { getDifferentKeys, normalizeValue } from './surveyCompareValues'

export interface CategoryMatch {
  source?: any
  target?: any
  matchedBy?: string
}

export const categoryChangeId = (uuid: string): string => `category:${uuid}`
export const categoryRemovalChangeId = (uuid: string): string => `categoryRemoval:${uuid}`

/**
 * Matches the categories of two surveys: by uuid first, then by name.
 * @param {object} params - The parameters.
 * @param {any} params.sourceSurvey - Source survey.
 * @param {any} params.targetSurvey - Target survey.
 * @returns {CategoryMatch[]} - The matches (unmatched categories have only source or target).
 */
export const matchCategories = ({ sourceSurvey, targetSurvey }): CategoryMatch[] => {
  const sourceCategories = Survey.getCategoriesArray(sourceSurvey)
  const targetCategories = Survey.getCategoriesArray(targetSurvey)
  const targetsMatched = new Set<string>()
  const matches: CategoryMatch[] = []
  const sourcesUnmatched = []

  for (const source of sourceCategories) {
    const target = Survey.getCategoryByUuid(Category.getUuid(source))(targetSurvey)
    if (target) {
      targetsMatched.add(Category.getUuid(target))
      matches.push({ source, target, matchedBy: SurveyCompareMatchType.uuid })
    } else {
      sourcesUnmatched.push(source)
    }
  }
  for (const source of sourcesUnmatched) {
    const target = targetCategories.find(
      (category) =>
        !targetsMatched.has(Category.getUuid(category)) && Category.getName(category) === Category.getName(source)
    )
    if (target) {
      targetsMatched.add(Category.getUuid(target))
      matches.push({ source, target, matchedBy: SurveyCompareMatchType.name })
    } else {
      matches.push({ source })
    }
  }
  for (const target of targetCategories) {
    if (!targetsMatched.has(Category.getUuid(target))) {
      matches.push({ target })
    }
  }
  return matches
}

export const normalizeCategory = (category: any) => ({
  name: Category.getName(category),
  levels: Category.getLevelsArray(category).map(CategoryLevel.getName),
  itemExtraDef: normalizeValue(Category.getItemExtraDef(category)),
  reportingData: Category.isReportingData(category) || undefined,
})

export const normalizeItem = (item: any) =>
  normalizeValue({
    labels: CategoryItem.getLabels(item),
    descriptions: CategoryItem.getDescriptions(item),
    extra: CategoryItem.getExtra(item),
  }) ?? {}

/**
 * Indexes category items by code path (codes of the item and its ancestors, serialized as JSON).
 * @param {any[]} items - Category items.
 * @returns {Record<string, {item: any, codePath: string[]}>} - Items indexed by code path key.
 */
export const indexItemsByCodePath = (items: any[] = []): Record<string, { item: any; codePath: string[] }> => {
  const itemsByUuid = {}
  for (const item of items) {
    itemsByUuid[CategoryItem.getUuid(item)] = item
  }
  const codePathByUuid: Record<string, string[]> = {}
  const getCodePath = (item: any): string[] => {
    const uuid = CategoryItem.getUuid(item)
    const cached = codePathByUuid[uuid]
    if (cached) return cached
    const parentUuid = CategoryItem.getParentUuid(item)
    const parent = parentUuid ? itemsByUuid[parentUuid] : null
    const codePath = [...(parent ? getCodePath(parent) : []), CategoryItem.getCode(item)]
    codePathByUuid[uuid] = codePath
    return codePath
  }
  const result = {}
  for (const item of items) {
    const codePath = getCodePath(item)
    result[JSON.stringify(codePath)] = { item, codePath }
  }
  return result
}

const compareItems = ({ sourceItems, targetItems }): SurveyCompareCategoryItemDiff[] => {
  const sourceIndex = indexItemsByCodePath(sourceItems)
  const targetIndex = indexItemsByCodePath(targetItems)
  const diffs: SurveyCompareCategoryItemDiff[] = []
  for (const [key, { item: sourceItem, codePath }] of Object.entries(sourceIndex)) {
    const targetEntry = targetIndex[key]
    if (!targetEntry) {
      diffs.push({ codePath, status: SurveyCompareStatus.added, propDiffs: [] })
      continue
    }
    const source = normalizeItem(sourceItem)
    const target = normalizeItem(targetEntry.item)
    const propDiffs = getDifferentKeys({ source, target }).map((propKey) => ({
      key: propKey,
      group: SurveyComparePropGroup.props,
      source: source[propKey],
      target: target[propKey],
    }))
    if (propDiffs.length > 0) {
      diffs.push({ codePath, status: SurveyCompareStatus.changed, propDiffs })
    }
  }
  for (const [key, { item, codePath }] of Object.entries(targetIndex)) {
    if (!sourceIndex[key]) {
      const published = CategoryItem.isPublished(item) || undefined
      diffs.push({ codePath, status: SurveyCompareStatus.removed, propDiffs: [], published })
    }
  }
  return diffs
}

const countItemsByStatus = (items: SurveyCompareCategoryItemDiff[]) => ({
  added: items.filter((item) => item.status === SurveyCompareStatus.added).length,
  changed: items.filter((item) => item.status === SurveyCompareStatus.changed).length,
  removed: items.filter((item) => item.status === SurveyCompareStatus.removed).length,
})

const getCategoryPropDiffs = ({ source, target }): SurveyComparePropDiff[] => {
  const sourceNormalized = normalizeCategory(source)
  const targetNormalized = normalizeCategory(target)
  return getDifferentKeys({ source: sourceNormalized, target: targetNormalized }).map((key) => ({
    key,
    group: SurveyComparePropGroup.props,
    source: sourceNormalized[key],
    target: targetNormalized[key],
  }))
}

/** Category props that can be updated from the comparison. */
export const updatableCategoryProps: string[] = [
  Category.keysProps.name,
  Category.keysProps.itemExtraDef,
  Category.keysProps.reportingData,
]

const getLevelNames = (category: any): string[] => Category.getLevelsArray(category).map(CategoryLevel.getName)

/**
 * Levels of the target category to delete: the ones beyond the levels of the source category.
 * @param {object} params - The parameters.
 * @param {any} params.source - Source category.
 * @param {any} params.target - Target category.
 * @returns {{deletable: any[], published: any[]}} - Unpublished (deletable) and published extra levels.
 */
export const getExtraTargetLevels = ({ source, target }) => {
  const extraLevels = Category.getLevelsArray(target).slice(Category.getLevelsArray(source).length)
  return {
    deletable: extraLevels.filter((level) => !CategoryLevel.isPublished(level)),
    published: extraLevels.filter(CategoryLevel.isPublished),
  }
}

// levels are renamed or added at the end
const hasLevelsToUpdate = ({ source, target }): boolean => {
  const sourceNames = getLevelNames(source)
  const targetNames = getLevelNames(target)
  return sourceNames.length > targetNames.length || sourceNames.some((name, index) => name !== targetNames[index])
}

const getMatchedCategoryApplicability = ({ source, target, propDiffs, itemsCount }) => {
  const hasApplicableChanges =
    itemsCount.added > 0 ||
    itemsCount.changed > 0 ||
    hasLevelsToUpdate({ source, target }) ||
    propDiffs.some((propDiff) => updatableCategoryProps.includes(propDiff.key))
  return hasApplicableChanges
    ? { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] }
    : { status: SurveyCompareApplicabilityStatus.notApplicable, reasons: [] }
}

const toRemovalApplicability = ({ deletableCount, reasons }) => {
  if (deletableCount === 0) {
    return { status: SurveyCompareApplicabilityStatus.notApplicable, reasons }
  }
  return {
    status:
      reasons.length > 0
        ? SurveyCompareApplicabilityStatus.applicableWithWarning
        : SurveyCompareApplicabilityStatus.applicable,
    reasons,
  }
}

// items and levels only in the target survey: unpublished ones can be deleted, published ones are kept
const getCategoryRemoval = ({ source, target, items }) => {
  const removedItems = items.filter((item) => item.status === SurveyCompareStatus.removed)
  const extraLevels = getExtraTargetLevels({ source, target })
  if (removedItems.length === 0 && extraLevels.deletable.length + extraLevels.published.length === 0) {
    return undefined
  }
  const reasons = []
  if (removedItems.some((item) => item.published)) reasons.push(SurveyCompareReason.publishedCategoryItemsKept)
  if (extraLevels.published.length > 0) reasons.push(SurveyCompareReason.publishedCategoryLevelsKept)
  const deletableCount = removedItems.filter((item) => !item.published).length + extraLevels.deletable.length
  return {
    id: categoryRemovalChangeId(Category.getUuid(source)),
    status: SurveyCompareStatus.removed,
    applicability: toRemovalApplicability({ deletableCount, reasons }),
    dependsOn: [],
    linkedTo: [],
  }
}

const compareMatchedCategories = ({ match, sourceItemsByCategoryUuid, targetItemsByCategoryUuid }) => {
  const { source, target, matchedBy } = match
  const sourceUuid = Category.getUuid(source)
  const targetUuid = Category.getUuid(target)
  const propDiffs = getCategoryPropDiffs({ source, target })
  const items = compareItems({
    sourceItems: sourceItemsByCategoryUuid[sourceUuid],
    targetItems: targetItemsByCategoryUuid[targetUuid],
  })
  const itemsCount = countItemsByStatus(items)
  const changed = propDiffs.length > 0 || items.length > 0
  const onlyRemovals =
    changed &&
    itemsCount.added + itemsCount.changed === 0 &&
    getMatchedCategoryApplicability({ source, target, propDiffs, itemsCount }).status ===
      SurveyCompareApplicabilityStatus.notApplicable
  return {
    id: categoryChangeId(sourceUuid),
    sourceUuid,
    targetUuid,
    matchedBy,
    name: Category.getName(source),
    status: changed ? SurveyCompareStatus.changed : SurveyCompareStatus.identical,
    propDiffs,
    items,
    itemsCount,
    // when only removals differ, the category change itself has nothing to apply: only its removal can be selected
    applicability:
      changed && !onlyRemovals ? getMatchedCategoryApplicability({ source, target, propDiffs, itemsCount }) : undefined,
    removal: changed ? getCategoryRemoval({ source, target, items }) : undefined,
    dependsOn: [],
    linkedTo: [],
  }
}

/**
 * Compares the categories (and their items) of two surveys.
 * @param {object} params - The parameters.
 * @param {CategoryMatch[]} params.matches - Category matches.
 * @param {CategoryItemsByCategoryUuid} params.sourceItemsByCategoryUuid - Items of the source survey categories.
 * @param {CategoryItemsByCategoryUuid} params.targetItemsByCategoryUuid - Items of the target survey categories.
 * @returns {SurveyCompareCategoryDiff[]} - The category diffs, sorted by name.
 */
export const compareCategories = ({
  matches,
  sourceItemsByCategoryUuid,
  targetItemsByCategoryUuid,
}: {
  matches: CategoryMatch[]
  sourceItemsByCategoryUuid: CategoryItemsByCategoryUuid
  targetItemsByCategoryUuid: CategoryItemsByCategoryUuid
}): SurveyCompareCategoryDiff[] =>
  matches
    .map((match): SurveyCompareCategoryDiff => {
      const { source, target } = match
      if (source && target) {
        return compareMatchedCategories({ match, sourceItemsByCategoryUuid, targetItemsByCategoryUuid })
      }
      const category = source ?? target
      const uuid = Category.getUuid(category)
      const items = source ? (sourceItemsByCategoryUuid[uuid] ?? []) : (targetItemsByCategoryUuid[uuid] ?? [])
      return {
        id: categoryChangeId(uuid),
        sourceUuid: source ? uuid : undefined,
        targetUuid: target ? uuid : undefined,
        name: Category.getName(category),
        status: source ? SurveyCompareStatus.added : SurveyCompareStatus.removed,
        propDiffs: [],
        items: [],
        itemsCount: { added: source ? items.length : 0, changed: 0, removed: source ? 0 : items.length },
        // removals: applicability depends on the node defs using the category (see evaluateApplicability)
        applicability: { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] },
        dependsOn: [],
        linkedTo: [],
      }
    })
    .sort((diffA, diffB) => diffA.name.localeCompare(diffB.name))
