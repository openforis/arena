import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

const CODE_JOINT_CODE_SEPARATOR = '*'

const assocParentAndChildren = ({ category, items }) => {
  if (Category.getLevelsArray(category).length > 1) {
    items.forEach((item) => {
      const children = items.filter((itm) => CategoryItem.getParentUuid(itm) === CategoryItem.getUuid(item))
      children.forEach((child) => (child.parent = item))
      item.children = children
    })
  }
}

const getAncestorItem = ({ category, item, levelIndex }) => {
  const { parent } = item
  if (levelIndex === Category.getItemLevelIndex(item)(category) - 1) {
    return parent
  }
  return getAncestorItem({ category, item: parent, levelIndex })
}

const getAncestorItemCode = ({ category, item, levelIndex }) => {
  const itemLevelIndex = Category.getItemLevelIndex(item)(category)
  if (itemLevelIndex === levelIndex) {
    return CategoryItem.getCode(item)
  }
  if (itemLevelIndex > levelIndex) {
    return CategoryItem.getCode(getAncestorItem({ category, item, levelIndex }))
  }
  return null
}

const assocCumulativeArea = ({ category, items }) => {
  // Calculate cumulative area for each item.
  // If item is leaf, cumulative area = area, otherwise it's the sum of the cumulative areas of the children.
  const calculateCumulativeArea = (item) => {
    if (!isNaN(item.areaCumulative)) {
      return item.areaCumulative
    }
    if (Category.isItemLeaf(item)(category)) {
      return Number(CategoryItem.getExtraProp('area')(item)) || 0
    }
    return item.children.reduce((totalArea, childItem) => totalArea + calculateCumulativeArea(childItem), 0)
  }
  items.forEach((item) => {
    item.areaCumulative = calculateCumulativeArea(item)
  })
}

const extractAncestoLevelCodes = ({ category, item }) => {
  const levels = Category.getLevelsArray(category)
  const hierarchical = levels.length > 1

  if (!hierarchical) return {}

  const itemLevelIndex = Category.getItemLevelIndex(item)(category)

  const ancestorItemCodes = levels.reduce((acc, _level, levelIndex) => {
    if (levelIndex <= itemLevelIndex) {
      acc.push(getAncestorItemCode({ category, item, levelIndex }))
    }
    return acc
  }, [])

  return {
    level: itemLevelIndex + 1,
    code_joint: ancestorItemCodes.join(CODE_JOINT_CODE_SEPARATOR),
    ...levels.reduce((acc, _level, levelIndex) => {
      acc[`level_${levelIndex + 1}_code`] = ancestorItemCodes[levelIndex]
      return acc
    }, {}),
  }
}

const extractExtraDefsSummary = ({ category, item }) => {
  const extraDefKeys = Category.getItemExtraDefKeys(category)

  return extraDefKeys.reduce(
    (acc, extraDefKey) => ({ ...acc, [extraDefKey]: CategoryItem.getExtraProp(extraDefKey)(item) }),
    {}
  )
}

const toItemSummary = ({ category, language, item }) => {
  return {
    uuid: CategoryItem.getUuid(item),
    code: CategoryItem.getCode(item),
    label: CategoryItem.getLabel(language)(item),
    ...extractAncestoLevelCodes({ category, item }),
    ...extractExtraDefsSummary({ category, item }),
    ...(Category.isReportingData(category)
      ? {
          area_cumulative: item.areaCumulative,
        }
      : {}),
  }
}

const toItemsSummary = ({ category, items, language }) => {
  assocParentAndChildren({ category, items })

  if (Category.isReportingData(category)) {
    assocCumulativeArea({ category, items })
  }

  return items.map((item) => toItemSummary({ category, language, item }))
}

export const CategoryItemsSummaryBuilder = {
  toItemsSummary,
}
