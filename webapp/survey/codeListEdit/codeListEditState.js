import * as R from 'ramda'

import { getCodeLists, getCodeListByUUID } from '../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    codeListEdit: {
      uuid: '',
      levelItems: {
        0: {'itemUUID': {}},
        1: {'itemUUID': {}},
        2: {'itemUUID': {}},
      },
      levelActiveItems: {
        0: 'itemUUID',
        1: 'itemUUID',
        2: 'itemUUID',
      }
    },

  },
}

const codeListEdit = 'codeListEdit'

const codeListUUID = 'codeListUUID'
const levelItems = 'levelItems'
const levelActiveItems = 'levelActiveItems'

// ==== current editing codeList

export const assocCodeListEdit = (codeListUUID) => codeListUUID ? {codeListUUID} : null

export const getCodeListEditCodeList = survey => R.pipe(
  R.path([codeListEdit, codeListUUID]),
  codeListUUUID => getCodeListByUUID(codeListUUUID)(survey),
)(survey)

// ==== level
export const dissocLevel = levelIndex => R.pipe(
  assocLevelActiveItem(levelIndex, null),
  R.dissocPath([levelItems, levelIndex])
)

// ==== level items

export const assocLevelItems = (levelIndex, items) =>
  R.assocPath([levelItems, levelIndex], items)

export const getCodeListEditLevelItemsArray = levelIndex => R.pipe(
  R.pathOr({}, [codeListEdit, levelItems, levelIndex]),
  R.values,
  R.sort((a, b) => Number(a.id) - Number(b.id)),
)

// ==== level item
export const assocLevelItem = (levelIndex, item) =>
  R.assocPath([levelItems, levelIndex, item.uuid], item)

export const createLevelItem = (levelIndex, item) => R.pipe(
  assocLevelItem(levelIndex, item),
  assocLevelActiveItem(levelIndex, item.uuid),
)

export const dissocLevelItem = (levelIndex, itemUUID) => R.pipe(
  assocLevelActiveItem(levelIndex, null),
  R.dissocPath([levelItems, levelIndex, itemUUID])
)

// ==== level active item(s)
const getLevelActiveItems = R.pathOr({}, [codeListEdit, levelActiveItems])

const getLevelActiveItemUUID = levelIndex => R.pipe(
  getLevelActiveItems,
  R.prop(levelIndex),
)

export const getCodeListEditLevelActiveItem = levelIndex =>
  survey => R.pipe(
    getLevelActiveItemUUID(levelIndex),
    activeItemUUID => {
      const levelItems = getCodeListEditLevelItemsArray(levelIndex)(survey)
      return R.find(item => item.uuid === activeItemUUID, levelItems)
    },
  )(survey)

export const getCodeListEditLevelActiveItemByUUID = (levelIndex, itemUUID) =>
  R.path([codeListEdit, levelItems, levelIndex, itemUUID])

export const getCodeListEditLevelActiveItemAndAncestorsUUIDs = levelIndex =>
  survey => R.pipe(
    getLevelActiveItems,
    R.keys,
    R.filter(index => index <= levelIndex),
    R.sort((a, b) => Number(a.id) - Number(b.id)),
    R.reduce((acc, prevLevelIndex) => R.append(getLevelActiveItemUUID(prevLevelIndex)(survey), acc), []),
  )(survey)

export const assocLevelActiveItem = (levelIndex, itemUUID) => R.pipe(
  resetNextLevels(levelIndex, levelItems),
  resetNextLevels(levelIndex, levelActiveItems),
  state => itemUUID
    ? R.assocPath([levelActiveItems, levelIndex], itemUUID, state)
    : R.dissocPath([levelActiveItems, levelIndex], state),
)

const resetNextLevels = (levelIndex, prop) =>
  codeListEditState => R.reduce(
    (acc, idx) => idx > levelIndex ? R.dissocPath([prop, idx], acc) : acc,
    codeListEditState,
    R.pipe(
      R.prop(prop),
      R.keys,
      R.map(k => +k)
    )(codeListEditState)
  )

