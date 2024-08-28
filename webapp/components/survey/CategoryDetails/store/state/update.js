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

const _calculateItemsArray = ({ levelIndex }) =>
  A.pipe(
    getItems({ levelIndex }),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id))
  )

const _refreshItemsArray =
  ({ levelIndex }) =>
  (state) => {
    const itemsArray = _calculateItemsArray({ levelIndex })(state)
    return R.assocPath([keys.itemsArray, String(levelIndex)], itemsArray)(state)
  }

export const assocItems = ({ levelIndex, items }) =>
  A.pipe(R.assocPath([keys.items, String(levelIndex)], items), _refreshItemsArray({ levelIndex }))

export const dissocItems = ({ levelIndex }) =>
  A.pipe(R.dissocPath([keys.items, String(levelIndex)]), R.dissocPath([keys.itemsArray, String(levelIndex)]))

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
    _resetNextLevelsByProp({ levelIndex, prop: keys.itemsLoading }),
    _resetNextLevelsByProp({ levelIndex, prop: keys.itemsArray }),
    _resetNextLevelsByProp({ levelIndex, prop: keys.itemsActive })
  )

export const assocItemsLoading = ({ levelIndex, loading = true }) =>
  R.assocPath([keys.itemsLoading, String(levelIndex)], loading)

export const dissocItemsLoading = ({ levelIndex }) => R.dissocPath([keys.itemsLoading, String(levelIndex)])

export const assocItemActive = ({ levelIndex, itemUuid }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.assocPath([keys.itemsActive, String(levelIndex)], itemUuid))

export const dissocItemActive = ({ levelIndex }) =>
  A.pipe(_resetNextLevels({ levelIndex }), R.dissocPath([keys.itemsActive, levelIndex]))

export const dissocItemsActive = A.dissoc(keys.itemsActive)

export const dissocItem = ({ levelIndex, itemUuid }) =>
  A.pipe(
    dissocItemActive({ levelIndex }),
    R.dissocPath([keys.items, levelIndex, itemUuid]),
    _refreshItemsArray({ levelIndex })
  )

export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)

export const assocImportSummaryItemDataType =
  ({ key, dataType }) =>
  (state) => {
    const summary = getImportSummary(state)
    const summaryUpdated = CategoryImportSummary.assocItemDataType(key, dataType)(summary)
    return assocImportSummary({ summary: summaryUpdated })(state)
  }

export const dissocImportSummary = A.dissoc(keys.importSummary)

export const assocCleaned = A.assoc(keys.cleaned, true)

export const assocEditingItemExtraDefs = A.assoc(keys.editingItemExtraDefs)
