import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as StringUtils from '@core/stringUtils'

import { keys } from './keys'

export const isDirty = (state) => !!A.prop(keys.dirty)(state)

export const getCategory = A.prop(keys.category)

export const getFileFormat = A.prop(keys.fileFormat)

export const getImportSummary = A.prop(keys.importSummary)

export const isItemsLoading = ({ levelIndex }) => A.pathOr(false, [keys.itemsLoading, String(levelIndex)])

export const getItems = ({ levelIndex }) => A.pathOr({}, [keys.items, String(levelIndex)])

export const getItemsArray = ({ levelIndex }) => A.pathOr([], [keys.itemsArray, String(levelIndex)])

export const getItemActive =
  ({ levelIndex }) =>
  (state) => {
    const itemActiveUuid = A.path([keys.itemsActive, String(levelIndex)])(state)
    const items = getItems({ levelIndex })(state)
    return items[itemActiveUuid]
  }

export const isItemActiveLeaf =
  ({ levelIndex }) =>
  (state) => {
    const itemsChildren = getItemsArray({ levelIndex: levelIndex + 1 })(state)
    return A.isEmpty(itemsChildren)
  }

export const getItemActiveLastLevelIndex = A.pipe(
  A.prop(keys.itemsActive),
  A.keys,
  A.map(Number),
  A.sort((a, b) => a - b),
  A.last
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
