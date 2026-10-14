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
import { areNormalizedValuesEqual, getDifferentKeys, normalizeValue } from './surveyCompareValues'

export interface CategoryMatch {
  source?: any
  target?: any
  matchedBy?: string
}

export const categoryChangeId = (uuid: string): string => `category:${uuid}`

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

const normalizeCategory = (category: any) => ({
  name: Category.getName(category),
  levels: Category.getLevelsArray(category).map(CategoryLevel.getName),
  itemExtraDef: normalizeValue(Category.getItemExtraDef(category)),
  reportingData: Category.isReportingData(category) || undefined,
})

const normalizeItem = (item: any) =>
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
  for (const [key, { codePath }] of Object.entries(targetIndex)) {
    if (!sourceIndex[key]) {
      diffs.push({ codePath, status: SurveyCompareStatus.removed, propDiffs: [] })
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
export const updatableCategoryProps: string[] = [Category.keysProps.name, Category.keysProps.itemExtraDef]

const getMatchedCategoryApplicability = ({ propDiffs, itemsCount }) => {
  if (propDiffs.some((propDiff) => propDiff.key === 'levels')) {
    return {
      status: SurveyCompareApplicabilityStatus.notApplicable,
      reasons: [SurveyCompareReason.categoryLevelsChanged],
    }
  }
  const reasons = []
  if (itemsCount.removed > 0) {
    // items only in the target survey are kept
    reasons.push(SurveyCompareReason.categoryItemsRemovalNotSupported)
  }
  if (propDiffs.some((propDiff) => propDiff.key === Category.keysProps.reportingData)) {
    reasons.push(SurveyCompareReason.categoryReportingDataChanged)
  }
  const hasApplicableChanges =
    itemsCount.added > 0 ||
    itemsCount.changed > 0 ||
    propDiffs.some((propDiff) => updatableCategoryProps.includes(propDiff.key))
  if (!hasApplicableChanges) {
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
    applicability: changed ? getMatchedCategoryApplicability({ propDiffs, itemsCount }) : undefined,
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
        applicability: source
          ? { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] }
          : {
              status: SurveyCompareApplicabilityStatus.notApplicable,
              reasons: [SurveyCompareReason.categoryRemovalNotSupported],
            },
        dependsOn: [],
        linkedTo: [],
      }
    })
    .sort((diffA, diffB) => diffA.name.localeCompare(diffB.name))

export const areCategoryLevelsEqual = ({ source, target }): boolean =>
  areNormalizedValuesEqual(
    Category.getLevelsArray(source).map(CategoryLevel.getName),
    Category.getLevelsArray(target).map(CategoryLevel.getName)
  )
