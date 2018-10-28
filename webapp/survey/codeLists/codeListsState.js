import * as R from 'ramda'

import {
  getCodeLists as getSurveyCodeLists,
  getCodeListByUUID,
} from '../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    codeLists: {
      uuid: {
        // codelist
        uuid: '',
        props: {},
        levels: {
          0: {
            uuid: '',
            props: {},
          },
        }
      },

      // loaded codeList
      codeListEdit: {
        uuid: '',
        levelItems: {
          0: {'itemUUID': {}},
          1: {'itemUUID': {}},
        },
        activeLevelItem: {
          0: 'uuid',
          1: 'uuid',
        }
      },

    },
  }
}

const codeListEdit = 'codeListEdit'

const codeListEditPath = [codeListEdit]
// const activeLevelItemPath = R.concat(codeListEditPath, ['activeLevelItem'])
const activeLevelItemPath = [codeListEdit, 'activeLevelItem']
const levelItemsPath = [codeListEdit, 'levelItems']//R.append('levelItems', codeListEditPath)

export const getCodeLists = R.pipe(
  getSurveyCodeLists,
  R.dissoc(codeListEdit)
)

// ==== current editing codeList

export const updateCodeListEdit = (codeListUUID = null) =>
  codeListUUID
    ? R.assocPath([codeListEdit, 'uuid'], codeListUUID)
    : R.dissocPath([codeListEdit])

export const getCodeListEdit = survey => R.pipe(
  getSurveyCodeLists,
  R.path([codeListEdit, 'uuid']),
  codeListUUUID => getCodeListByUUID(codeListUUUID)(survey),
)(survey)

const getLevelItem = R.pipe(
  R.path(activeLevelItemPath),
  R.defaultTo({}),
)

const getLevelItemUUID = levelIndex => R.pipe(
  getLevelItem,
  R.prop(levelIndex),
)

export const getCodeListEditLevelItem = levelIndex => survey => R.pipe(
  getSurveyCodeLists,
  getLevelItemUUID(levelIndex),
  activeItemUUID => R.find(item => item.uuid === activeItemUUID, getCodeListEditLevelItemsArray(levelIndex)(survey)),
)(survey)

export const getCodeListEditLevelItems = levelIndex => R.pipe(
  getSurveyCodeLists,
  R.path(levelItemsPath),
  R.prop(levelIndex),
  R.defaultTo({}),
)

export const getCodeListEditLevelItemsArray = levelIndex => R.pipe(
  getCodeListEditLevelItems(levelIndex),
  R.values,
  R.sort((a, b) => Number(a.id) - Number(b.id)),
)

export const getCodeListEditLevelItemByUUID = (levelIndex, itemUUID) => R.path(R.concat(levelItemsPath, [levelIndex, itemUUID]))

export const getCodeListEditActiveItemAndAncestorsUUIDs = levelIndex => survey => R.pipe(
  getSurveyCodeLists,
  x=>console.log('1 ' ,x) || x,
  getLevelItem,
  x=>console.log('2 ',x) || x,
  R.keys,
  x=>console.log('3 ',x) || x,
  R.filter(index => index <= levelIndex),
  x=>console.log('4 ',x) || x,
  R.sort((a, b) => Number(a.id) - Number(b.id)),
  x=>console.log('5 ',x) || x,
  R.reduce((acc, prevLevelIndex) => R.append(getLevelItemUUID(prevLevelIndex)(survey), acc), []),
  x=>console.log('6 ',x) || x,
)(survey)

// ========== UPDATE

export const assocCodeListEditLevelItems = (levelIndex, items) =>

  // ?????
  state => R.pipe(
    R.path(R.append(levelIndex, levelItemsPath)),
    oldItems => R.merge(oldItems, items),
    //remove deleted items (null value)
    updatedItems => R.reduce((acc, itemUUID) => R.prop(itemUUID)(acc) === null ? R.dissoc(itemUUID)(acc) : acc, updatedItems, R.keys(updatedItems)),
    updatedItems => R.assocPath(R.append(levelIndex, levelItemsPath), updatedItems)(state),
  )(state)

export const dissocCodeListEditLevelItems = (levelIndex) => R.dissocPath([codeListEdit, levelItemsPath, levelIndex])

export const assocCodeListEditLevelItem = (levelIndex, itemUUID) => codeLists => R.pipe(
  dissocCodeListEditActiveLevelItem(levelIndex),
  getLevelItem,
  R.assoc(levelIndex, itemUUID),
  updatedActiveItems => R.assocPath(activeLevelItemPath, updatedActiveItems)(codeLists)
)(codeLists)

export const dissocCodeListEditActiveLevelItem = (levelIndex) => codeLists => R.pipe(
  getLevelItem,
  //remove items in following levels
  activeItems => R.reduce((acc, index) =>
      R.assoc(index, R.prop(index)(activeItems), acc)
    , {})
  (R.filter(index => index < levelIndex)(R.keys(activeItems))), //consider only previous levels items
  updatedActiveItems => R.assocPath(activeLevelItemPath, updatedActiveItems)(codeLists),

  dissocLevelItems(levelIndex + 1),
)(codeLists)

const dissocLevelItems = levelIndex => state => R.pipe(
  R.path(levelItemsPath),
  //remove items in following levels
  itemsByLevel => R.reduce((acc, index) =>
      R.assoc(index, R.prop(index)(itemsByLevel), acc)
    , {})
  (R.filter(index => index < levelIndex)(R.keys(itemsByLevel))), //consider only previous levels items
  updatedItemsByLevel => R.assocPath(levelItemsPath, updatedItemsByLevel)(state)
)(state)

