import * as R from 'ramda'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import { keys } from './keys'

export const getCategory = A.prop(keys.category)

export const getImportSummary = A.prop(keys.importSummary)

export const getItems = ({ levelIndex }) => R.pathOr({}, [keys.items, String(levelIndex)])

export const getItemsArray = ({ levelIndex }) =>
  A.pipe(
    getItems({ levelIndex }),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )

export const getItemActive =
  ({ levelIndex }) =>
  (state) => {
    const itemActiveUuid = R.path([keys.itemsActive, String(levelIndex)])(state)
    const items = getItemsArray({ levelIndex })(state)
    return items.find((item) => CategoryItem.getUuid(item) === itemActiveUuid)
  }

export const isItemActiveLeaf =
  ({ levelIndex }) =>
  (state) => {
    const itemsChildren = getItemsArray({ levelIndex: levelIndex + 1 })(state)
    return A.isEmpty(itemsChildren)
  }

export const getItemActiveLastLevelIndex = A.pipe(
  A.prop(keys.itemsActive),
  R.keys,
  R.map(Number),
  R.sort((a, b) => a - b),
  R.last
)

export const isCategoryEmpty = (state) => {
  const category = getCategory(state)
  return (
    category &&
    StringUtils.isBlank(Category.getName(category)) &&
    Category.getLevelsArray(category).length === 1 &&
    getItemsArray({ levelIndex: 0 })(state).length === 0
  )
}

export const hasEmptyLevels = (state) => {
  const category = getCategory(state)
  Category.getLevelsArray(category).find()
}

export const isCleaned = A.propOr(false, keys.cleaned)

export const isEditingItemExtraDefs = A.propOr(false, keys.editingItemExtraDefs)

export const getOnCategoryUpdate = A.propOr(null, keys.onCategoryUpdate)
