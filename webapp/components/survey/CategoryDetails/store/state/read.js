import * as R from 'ramda'

import * as A from '@core/arena'
import * as CategoryItem from '@core/survey/categoryItem'

import { keys } from './keys'

export const getCategory = A.prop(keys.category)

export const isInCategoriesPath = A.prop(keys.inCategoriesPath)

export const getImportSummary = A.prop(keys.importSummary)

export const getItems = ({ levelIndex }) => R.pathOr({}, [keys.items, String(levelIndex)])

export const getItemsArray = ({ levelIndex }) =>
  A.pipe(
    getItems({ levelIndex }),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )

export const getItemActive = ({ levelIndex }) => (state) => {
  const itemActiveUuid = R.path([keys.itemsActive, String(levelIndex)])(state)
  const items = getItemsArray({ levelIndex })(state)
  return items.find((item) => CategoryItem.getUuid(item) === itemActiveUuid)
}

export const isItemActiveLeaf = ({ levelIndex }) => (state) => {
  const itemsChildren = getItemsArray({ levelIndex: levelIndex + 1 })(state)
  return A.isEmpty(itemsChildren)
}
