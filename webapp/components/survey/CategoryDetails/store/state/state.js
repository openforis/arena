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
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
}

// ===== CREATE
export const create = ({ inCategoriesPath }) => ({
  [keys.inCategoriesPath]: inCategoriesPath,
})

// ===== READ
export const getCategory = A.prop(keys.category)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)
export const getImportSummary = A.prop(keys.importSummary)
export const getLevelItemsArray = (levelIndex) =>
  A.pipe(
    R.pathOr({}, [keys.levelItems, levelIndex]),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )
const getLevelActiveItems = A.propOr(keys.levelActiveItems, {})
const getLevelActiveItemUuid = (levelIndex) => A.pipe(getLevelActiveItems, A.prop(String(levelIndex)))
export const getLevelActiveItem = (levelIndex) => (state) => {
  const activeItemUuid = getLevelActiveItemUuid(levelIndex)(state)
  const levelItems = getLevelItemsArray(levelIndex)(state)
  return levelItems.find((item) => CategoryItem.getUuid(item) === activeItemUuid)
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
export const assocLevelItems = ({ levelIndex, items }) => R.assocPath([keys.levelItems, String(levelIndex)], items)
export const dissocLevelItems = ({ levelIndex }) => R.dissocPath([keys.levelItems, String(levelIndex)])
export const dissocLevelActiveItem = ({ levelIndex }) => R.dissocPath([keys.levelActiveItems, String(levelIndex)])
export const dissocLevelActiveItems = A.dissoc(keys.levelActiveItems)

export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)
export const assocImportSummaryColumnDataType = ({ columnName, dataType }) => (state) => {
  const summary = getImportSummary(state)
  const summaryUpdated = CategoryImportSummary.assocColumnDataType(columnName, dataType)(summary)
  return assocImportSummary({ summary: summaryUpdated })(state)
}
export const dissocImportSummary = A.dissoc(keys.importSummary)
