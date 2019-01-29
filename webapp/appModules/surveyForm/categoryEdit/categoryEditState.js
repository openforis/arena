import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    categoryEdit: {
      uuid: '',
      levelItems: {
        0: {'itemUuid': {}},
        1: {'itemUuid': {}},
        2: {'itemUuid': {}},
      },
      levelActiveItems: {
        0: 'itemUuid',
        1: 'itemUuid',
        2: 'itemUuid',
      }
    },

  },
}

const categoryEdit = 'categoryEdit'

const categoryUuid = 'categoryUuid'
const levelItems = 'levelItems'
const levelActiveItems = 'levelActiveItems'

// ==== current editing category

export const initCategoryEdit = (categoryUuid) => categoryUuid ? {categoryUuid} : null

export const getCategoryForEdit = survey =>
  surveyForm => R.pipe(
    R.path([categoryEdit, categoryUuid]),
    categoryUuid => Survey.getCategoryByUuid(categoryUuid)(survey),
  )(surveyForm)

// ==== level
export const dissocLevel = levelIndex => R.pipe(
  assocLevelActiveItem(levelIndex, null),
  R.dissocPath([levelItems, levelIndex])
)

// ==== level items

export const assocLevelItems = (levelIndex, items) =>
  R.assocPath([levelItems, levelIndex], items)

export const getCategoryEditLevelItemsArray = (levelIndex) => R.pipe(
  R.pathOr({}, [categoryEdit, levelItems, levelIndex]),
  R.values,
  R.sort((a, b) => Number(a.id) - Number(b.id)),
)

// ==== level item
export const assocLevelItem = (levelIndex, item) =>
  R.assocPath([levelItems, levelIndex, item.uuid], item)

export const assocLevelItemProp = (level, item, key, value) =>
  R.assocPath([levelItems, level.index, item.uuid, 'props', key], value)

export const createLevelItem = (levelIndex, item) => R.pipe(
  assocLevelItem(levelIndex, item),
  assocLevelActiveItem(levelIndex, item.uuid),
)

export const dissocLevelItem = (levelIndex, itemUuid) => R.pipe(
  assocLevelActiveItem(levelIndex, null),
  R.dissocPath([levelItems, levelIndex, itemUuid])
)

// ==== level active item(s)
const getLevelActiveItems = R.pathOr({}, [categoryEdit, levelActiveItems])

const getLevelActiveItemUuid = levelIndex => R.pipe(
  getLevelActiveItems,
  R.prop(levelIndex),
)

export const getCategoryEditLevelActiveItem = levelIndex =>
  surveyForm => R.pipe(
    getLevelActiveItemUuid(levelIndex),
    activeItemUuid => {
      const levelItems = getCategoryEditLevelItemsArray(levelIndex)(surveyForm)
      return R.find(item => item.uuid === activeItemUuid, levelItems)
    },
  )(surveyForm)

export const assocLevelActiveItem = (levelIndex, itemUuid) => R.pipe(
  resetNextLevels(levelIndex, levelItems),
  resetNextLevels(levelIndex, levelActiveItems),
  state => itemUuid
    ? R.assocPath([levelActiveItems, levelIndex], itemUuid, state)
    : R.dissocPath([levelActiveItems, levelIndex], state),
)

const resetNextLevels = (levelIndex, prop) =>
  categoryEditState => R.reduce(
    (acc, idx) => idx > levelIndex ? R.dissocPath([prop, idx], acc) : acc,
    categoryEditState,
    R.pipe(
      R.prop(prop),
      R.keys,
      R.map(k => +k)
    )(categoryEditState)
  )

