import * as R from 'ramda'

import * as A from '@core/arena'
import * as CategoryItem from '@core/survey/categoryItem'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

const keys = {
  category: 'category',
  importSummary: 'importSummary',
  inCategoriesPath: 'inCategoriesPath',
  items: 'items',
  activeItems: 'activeItems',
}

// ===== CREATE
export const create = ({ inCategoriesPath }) => ({
  [keys.inCategoriesPath]: inCategoriesPath,
})

// ===== READ
export const getCategory = A.prop(keys.category)

export const isInCategoriesPath = A.prop(keys.inCategoriesPath)

export const getImportSummary = A.prop(keys.importSummary)

const _getLevelItems = ({ levelIndex }) => R.pathOr({}, [keys.items, String(levelIndex)])

export const getLevelItemsArray = ({ levelIndex }) =>
  A.pipe(
    _getLevelItems({ levelIndex }),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )

export const getLevelActiveItem = ({ levelIndex }) => (state) => {
  const activeItemUuid = R.path([keys.activeItems, String(levelIndex)])(state)
  const items = getLevelItemsArray({ levelIndex })(state)
  return items.find((item) => CategoryItem.getUuid(item) === activeItemUuid)
}

// ===== UPDATE
export const assocCategory = ({ category }) => A.assoc(keys.category, category)

export const assocCategoryProp = ({ key, value }) => (state) => {
  const category = getCategory(state)
  const categoryUpdated = Category.assocProp({ key, value })(category)
  return assocCategory({ category: categoryUpdated })(state)
}

export const assocLevelProp = ({ levelIndex, key, value }) => (state) => {
  const category = getCategory(state)
  const level = Category.getLevelByIndex(levelIndex)(category)
  const levelUpdated = CategoryLevel.assocProp({ key, value })(level)
  const categoryUpdated = Category.assocLevel({ level: levelUpdated })(category)
  return assocCategory({ category: categoryUpdated })(state)
}

export const assocLevelItems = ({ levelIndex, items }) => R.assocPath([keys.items, String(levelIndex)], items)

export const dissocLevelItems = ({ levelIndex }) => R.dissocPath([keys.items, String(levelIndex)])

export const assocItemProp = ({ levelIndex, itemUuid, key, value }) => (state) => {
  const items = _getLevelItems({ levelIndex })(state)
  const item = A.prop(itemUuid, items)
  const itemUpdated = CategoryItem.assocProp({ key, value })(item)
  const itemsUpdated = A.assoc(itemUuid, itemUpdated)(items)
  return assocLevelItems({ levelIndex, items: itemsUpdated })(state)
}

const _resetNextLevelsByProp = ({ levelIndex, prop }) => (state) => {
  const nextIndexes = A.pipe(
    A.prop(prop),
    R.keys,
    R.map((k) => Number(k)),
    R.filter((idx) => idx > levelIndex)
  )(state)

  return nextIndexes.reduce((accState, idx) => R.dissocPath([prop, idx], accState), state)
}

const _resetNextLevels = ({ levelIndex }) =>
  A.pipe(
    _resetNextLevelsByProp({ levelIndex, prop: keys.items }),
    _resetNextLevelsByProp({ levelIndex, prop: keys.activeItems })
  )

export const assocLevelActiveItem = ({ levelIndex, itemUuid }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.assocPath([keys.activeItems, String(levelIndex)], itemUuid))

export const dissocLevelActiveItem = ({ levelIndex }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.dissocPath([keys.activeItems, levelIndex]))

export const dissocActiveItems = A.dissoc(keys.activeItems)

export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)

export const assocImportSummaryColumnDataType = ({ columnName, dataType }) => (state) => {
  const summary = getImportSummary(state)
  const summaryUpdated = CategoryImportSummary.assocColumnDataType(columnName, dataType)(summary)
  return assocImportSummary({ summary: summaryUpdated })(state)
}

export const dissocImportSummary = A.dissoc(keys.importSummary)
