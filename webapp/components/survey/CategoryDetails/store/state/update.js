import * as R from 'ramda'

import * as A from '@core/arena'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import { keys } from './keys'
import { getCategory, getItems, getImportSummary } from './read'

export const assocCategory = ({ category }) => A.assoc(keys.category, category)

export const assocCategoryProp =
  ({ key, value }) =>
  (state) => {
    const category = getCategory(state)
    const categoryUpdated = Category.assocProp({ key, value })(category)
    return assocCategory({ category: categoryUpdated })(state)
  }

export const assocLevelProp =
  ({ levelIndex, key, value }) =>
  (state) => {
    const category = getCategory(state)
    const level = Category.getLevelByIndex(levelIndex)(category)
    const levelUpdated = CategoryLevel.assocProp({ key, value })(level)
    const categoryUpdated = Category.assocLevel({ level: levelUpdated })(category)
    return assocCategory({ category: categoryUpdated })(state)
  }

export const assocItems = ({ levelIndex, items }) => R.assocPath([keys.items, String(levelIndex)], items)

export const dissocItems = ({ levelIndex }) => R.dissocPath([keys.items, String(levelIndex)])

export const assocItem =
  ({ levelIndex, item }) =>
  (state) => {
    const items = getItems({ levelIndex })(state)
    const itemsUpdated = A.assoc(CategoryItem.getUuid(item), item)(items)
    return assocItems({ levelIndex, items: itemsUpdated })(state)
  }

export const assocItemProp =
  ({ levelIndex, itemUuid, key, value }) =>
  (state) => {
    const items = getItems({ levelIndex })(state)
    const item = A.prop(itemUuid, items)
    const itemUpdated = CategoryItem.assocProp({ key, value })(item)
    return assocItem({ levelIndex, item: itemUpdated })(state)
  }

const _resetNextLevelsByProp =
  ({ levelIndex, prop }) =>
  (state) => {
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
    _resetNextLevelsByProp({ levelIndex, prop: keys.itemsActive })
  )

export const assocItemActive = ({ levelIndex, itemUuid }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.assocPath([keys.itemsActive, String(levelIndex)], itemUuid))

export const dissocItemActive = ({ levelIndex }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.dissocPath([keys.itemsActive, levelIndex]))

export const dissocItemsActive = A.dissoc(keys.itemsActive)

export const dissocItem = ({ levelIndex, itemUuid }) =>
  A.pipe(dissocItemActive({ levelIndex }), R.dissocPath([keys.items, levelIndex, itemUuid]))

export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)

export const assocImportSummaryColumnDataType =
  ({ columnName, dataType }) =>
  (state) => {
    const summary = getImportSummary(state)
    const summaryUpdated = CategoryImportSummary.assocItemDataType(columnName, dataType)(summary)
    return assocImportSummary({ summary: summaryUpdated })(state)
  }

export const dissocImportSummary = A.dissoc(keys.importSummary)

export const assocCleaned = A.assoc(keys.cleaned, true)

export const assocEditingItemExtraDefs = A.assoc(keys.editingItemExtraDefs)
