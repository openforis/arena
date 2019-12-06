import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

import * as SurveyState from '@webapp/survey/surveyState'
import * as SurveyViewsState from '../surveyViewsState'

// DOCS
const stateDoc = {
  categoryEdit: {
    categoryUuid: '',
    levelItems: {
      0: { itemUuid: {} },
      1: { itemUuid: {} },
      2: { itemUuid: {} },
    },
    levelActiveItems: {
      0: 'itemUuid',
      1: 'itemUuid',
      2: 'itemUuid',
    },
  },
}

const keys = {
  categoryUuid: 'categoryUuid', // Current editing category uuid
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
  importSummary: 'importSummary',
}

export const stateKey = 'categoryEdit'
const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

// ==== current editing category

export const initCategoryEdit = categoryUuid => (categoryUuid ? { categoryUuid } : null)

export const getCategoryForEdit = state => {
  const survey = SurveyState.getSurvey(state)
  const categoryUuid = getStateProp(keys.categoryUuid)(state)
  return Survey.getCategoryByUuid(categoryUuid)(survey)
}

// ==== level

export const dissocLevel = levelIndex =>
  R.pipe(assocLevelActiveItem(levelIndex, null), R.dissocPath([keys.levelItems, levelIndex]))

// ==== level items

export const assocLevelItems = (levelIndex, items) => R.assocPath([keys.levelItems, levelIndex], items)

export const getLevelItemsArray = levelIndex =>
  R.pipe(
    SurveyViewsState.getState,
    R.pathOr({}, [stateKey, keys.levelItems, levelIndex]),
    R.values,
    R.sort((a, b) => Number(a.id) - Number(b.id)),
  )

// ==== level item

export const assocLevelItem = (levelIndex, item) =>
  R.assocPath([keys.levelItems, levelIndex, CategoryItem.getUuid(item)], item)

export const assocLevelItemProp = (level, item, key, value) =>
  R.assocPath([keys.levelItems, level.index, CategoryItem.getUuid(item), 'props', key], value)

export const createLevelItem = (levelIndex, item) =>
  R.pipe(assocLevelItem(levelIndex, item), assocLevelActiveItem(levelIndex, CategoryItem.getUuid(item)))

export const dissocLevelItem = (levelIndex, itemUuid) =>
  R.pipe(assocLevelActiveItem(levelIndex, null), R.dissocPath([keys.levelItems, levelIndex, itemUuid]))

// ==== level active item(s)

const getLevelActiveItems = getStateProp(keys.levelActiveItems, {})

const getLevelActiveItemUuid = levelIndex => R.pipe(getLevelActiveItems, R.prop(levelIndex))

export const getLevelActiveItem = levelIndex => state =>
  R.pipe(getLevelActiveItemUuid(levelIndex), activeItemUuid => {
    const levelItems = getLevelItemsArray(levelIndex)(state)
    return R.find(item => CategoryItem.getUuid(item) === activeItemUuid, levelItems)
  })(state)

export const assocLevelActiveItem = (levelIndex, itemUuid) =>
  R.pipe(resetNextLevels(levelIndex, keys.levelItems), resetNextLevels(levelIndex, keys.levelActiveItems), state =>
    itemUuid
      ? R.assocPath([keys.levelActiveItems, levelIndex], itemUuid, state)
      : R.dissocPath([keys.levelActiveItems, levelIndex], state),
  )

const resetNextLevels = (levelIndex, prop) => categoryState =>
  R.reduce(
    (acc, idx) => (idx > levelIndex ? R.dissocPath([prop, idx], acc) : acc),
    categoryState,
    R.pipe(
      R.prop(prop),
      R.keys,
      R.map(k => Number(k)),
    )(categoryState),
  )

// ==== import summary

export const getImportSummary = state => getStateProp(keys.importSummary)(state)

export const assocImportSummary = summary => state => R.assoc(keys.importSummary, summary)(state)

export const dissocImportSummary = state => R.dissoc(keys.importSummary)(state)

export const assocImportSummaryColumnDataType = (columnName, dataType) => categoryState =>
  R.pipe(R.prop(keys.importSummary), summary => {
    return assocImportSummary(CategoryImportSummary.assocColumnDataType(columnName, dataType)(summary))(categoryState)
  })(categoryState)
