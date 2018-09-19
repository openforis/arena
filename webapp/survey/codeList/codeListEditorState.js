import * as R from 'ramda'

// DOCS
const codeListManagerState = {
  survey: {
    //....
    codeLists: {
      uuid: {
        // codelist
      }
    },
    // loaded codeLists
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

  }
}

import { toUUIDIndexedObj } from '../../../common/survey/surveyUtils'

import {
  getCodeListLevelById,
  assocCodeListLevel,
  dissocCodeListLevel,
} from '../../../common/survey/codeList'

const codeListsPath = ['codeLists']
const codeListEditPath = ['codeListEdit']
const codeListUUIDPath = R.append('uuid', codeListEditPath)
const activeLevelItemPath = R.concat(codeListEditPath, ['activeLevelItem'])
const itemsPath = R.append('levelItems', codeListEditPath)

export const getCodeListsArray = R.pipe(
  R.path(codeListsPath),
  R.values,
)

export const getCodeListByUUID = uuid => R.path(R.append(uuid, codeListsPath))

export const getCodeListEditorCodeList = state => R.pipe(
  R.path(codeListsPath),
  codeLists => R.prop(R.path(codeListUUIDPath)(state))(codeLists),
)(state)

const getActiveLevelItem = R.pipe(
  R.path(activeLevelItemPath),
  R.defaultTo([]),
)

export const getCodeListEditorActiveLevelItem = levelIndex => state => R.pipe(
  getActiveLevelItem,
  R.prop(levelIndex),
  uuid => R.find(item => item.uuid === uuid, getCodeListEditorLevelItems(levelIndex)(state))
)(state)

export const getCodeListEditorLevelItems = levelIndex => R.pipe(
  R.path(itemsPath),
  R.prop(levelIndex),
  R.values,
  R.sortBy(R.prop('index')),
)

export const getCodeListEditorLevelItemByUUID = (levelIndex, itemUUID) => R.path(R.concat(itemsPath, [levelIndex, itemUUID]))

export const assocCodeList = codeList => R.assocPath(R.append(codeList.uuid, codeListsPath), codeList)

export const assocCodeListEditorListUUID = uuid => R.assocPath(codeListUUIDPath, uuid)

export const assocCodeListEditorLevel = level => state => R.pipe(
  getCodeListEditorCodeList,
  assocCodeListLevel(level),
  codeList => assocCodeList(codeList)(state),
)(state)

export const assocCodeListEditorItem = item => state => R.pipe(
  getCodeListEditorCodeList,
  getCodeListLevelById(item.levelId),
  level => R.assocPath(R.concat(itemsPath, [level.index, item.uuid]), item)(state)
)(state)

export const assocCodeListEditorLevelItems = (levelIndex, items) => R.assocPath(R.append(levelIndex, itemsPath), toUUIDIndexedObj(items))

export const assocCodeListEditorActiveLevelItem = (levelIndex, itemUUID) => state => R.pipe(
  dissocCodeListEditorActiveLevelItem(levelIndex),
  getActiveLevelItem,
  R.assoc(levelIndex, itemUUID),
  updatedActiveItems => R.assocPath(activeLevelItemPath, updatedActiveItems)(state)
)(state)

export const dissocCodeListEditorActiveLevelItem = (levelIndex) => state => R.pipe(
  getActiveLevelItem,
  //remove items in following levels
  activeItems => R.reduce((acc, index) =>
      R.assoc(index, R.prop(index)(activeItems), acc)
    , {})
  (R.filter(index => index < levelIndex)(R.keys(activeItems))), //consider only previous levels items
  updatedActiveItems => R.assocPath(activeLevelItemPath, updatedActiveItems)(state),

  dissocLevelItems(levelIndex + 1),
)(state)

const dissocLevelItems = levelIndex => state => R.pipe(
  R.path(itemsPath),
  //remove items in following levels
  itemsByLevel => R.reduce((acc, index) =>
      R.assoc(index, R.prop(index)(itemsByLevel), acc)
    , {})
  (R.filter(index => index < levelIndex)(R.keys(itemsByLevel))), //consider only previous levels items
  updatedItemsByLevel => R.assocPath(itemsPath, updatedItemsByLevel)(state)
)(state)

const dissocCodeListEditorLevel = levelIndex => state => R.pipe(
  getCodeListEditorCodeList,
  dissocCodeListLevel(levelIndex),
  updatedCodeList => assocCodeList(updatedCodeList)(state),
)(state)

export const dissocCodeListEditorLevelAndItems = levelIndex => state => R.pipe(
  dissocCodeListEditorActiveLevelItem(levelIndex),
  dissocLevelItems(levelIndex),
  dissocCodeListEditorLevel(levelIndex),
)(state)

export const dissocCodeListEditorItem = itemUUID => R.dissocPath(R.append(itemUUID, itemsPath))

export const dissocCodeListEditorList = codeListUUID => R.dissocPath(R.append(codeListUUID, codeListsPath))

export const dissocCodeListEditorCodeListEdit = R.dissocPath(codeListEditPath)

