import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

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

const toItemSummary = ({ category, language, item }) => {
  const extraDefKeys = Category.getItemExtraDefKeys(category)
  const levels = Category.getLevelsArray(category)
  const hierarchical = levels.length > 1

  return {
    code: CategoryItem.getCode(item),
    ...(hierarchical
      ? {
          level: Category.getItemLevelIndex(item)(category) + 1,
          ...levels.reduce(
            (acc, _level, levelIndex) => ({
              ...acc,
              [`level_${levelIndex + 1}_code`]: getAncestorItemCode({ category, item, levelIndex }),
            }),
            {}
          ),
        }
      : {}),
    label: CategoryItem.getLabel(language)(item),
    ...extraDefKeys.reduce(
      (acc, extraDefKey) => ({ ...acc, [extraDefKey]: CategoryItem.getExtraProp(extraDefKey)(item) }),
      {}
    ),
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
