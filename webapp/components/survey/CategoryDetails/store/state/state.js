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
export const getItemsArray = ({ levelIndex }) =>
  A.pipe(
    R.pathOr({}, [keys.items, levelIndex]),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )
export const getActiveItem = ({ levelIndex }) => (state) => {
  const activeItemUuid = R.path([keys.activeItems, String(levelIndex)])(state)
  const items = getItemsArray({ levelIndex })(state)
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
export const assocItems = ({ levelIndex, items }) => R.assocPath([keys.items, String(levelIndex)], items)
export const dissocItems = ({ levelIndex }) => R.dissocPath([keys.items, String(levelIndex)])

const _resetNextLevelsByProp = ({ levelIndex, prop }) => (state) => {
  const levelIndexesProp = A.pipe(
    A.prop(prop),
    R.keys,
    R.map((k) => Number(k))
  )(state)

  return levelIndexesProp.reduce(
    (accState, idx) => (idx > levelIndex ? R.dissocPath([prop, idx], accState) : accState),
    state
  )
}

const _resetNextLevels = ({ levelIndex }) =>
  A.pipe(
    _resetNextLevelsByProp({ levelIndex, prop: keys.items }),
    _resetNextLevelsByProp({ levelIndex, prop: keys.activeItems })
  )

export const assocActiveItem = ({ levelIndex, itemUuid }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.assocPath([keys.activeItems, String(levelIndex)], itemUuid))

export const dissocActiveItem = ({ levelIndex }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.dissocPath([keys.activeItems, levelIndex]))

export const dissocActiveItems = A.dissoc(keys.activeItems)

export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)
export const assocImportSummaryColumnDataType = ({ columnName, dataType }) => (state) => {
  const summary = getImportSummary(state)
  const summaryUpdated = CategoryImportSummary.assocColumnDataType(columnName, dataType)(summary)
  return assocImportSummary({ summary: summaryUpdated })(state)
}
export const dissocImportSummary = A.dissoc(keys.importSummary)
