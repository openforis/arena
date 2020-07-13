import * as R from 'ramda'

import * as A from '@core/arena'
import * as CategoryItem from '@core/survey/categoryItem'

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
export const assocCategory = (category) => A.assoc(keys.category, category)
export const assocLevelItems = (levelIndex, items) => R.assocPath([keys.levelItems, String(levelIndex)], items)
