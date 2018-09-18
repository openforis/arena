import * as R from 'ramda'

import {
  getCodeListLevelById,
  assocCodeListLevel,
  assocCodeListItem,
} from '../../../common/survey/codeList'

const codeListsEditorPath = ['codeListsEditor']

const editedCodeListPath = R.concat(codeListsEditorPath, ['codeList'])

const selectedItemsByLevelIndexPath = R.concat(codeListsEditorPath, ['itemsByLevelIndex'])

export const getCodeListsEditorEditedCodeList = R.path(editedCodeListPath)

const getCodeListsEditorSelectedItemsByLevelIndex = R.pipe(
  R.path(selectedItemsByLevelIndexPath),
  R.defaultTo([]),
)

export const getCodeListsEditorSelectedItemByLevelIndex = levelIndex => R.pipe(
  getCodeListsEditorSelectedItemsByLevelIndex,
  itemsByIndex => itemsByIndex.length > levelIndex ? itemsByIndex[levelIndex] : null
)

export const assocCodeListsEditorCodeList = list => R.assocPath(editedCodeListPath, list)

export const assocCodeListsEditorLevel = level => state => R.pipe(
  getCodeListsEditorEditedCodeList,
  assocCodeListLevel(level),
  codeList => R.assocPath(editedCodeListPath, codeList)(state),
)(state)

export const assocCodeListsEditorItem = item => state => R.pipe(
  getCodeListsEditorEditedCodeList,
  assocCodeListItem(item),
  updatedCodeList => R.assocPath(editedCodeListPath, updatedCodeList)(state),
)(state)

export const assocCodeListsEditorSelectedItemInLevel = (level, item) => state => R.pipe(
  dissocCodeListsEditorSelectedItemInLevel(level),
  getCodeListsEditorSelectedItemsByLevelIndex,
  R.append(item),
  newSelectedItemsByLevelIndex => R.assocPath(selectedItemsByLevelIndexPath, newSelectedItemsByLevelIndex)(state)
)(state)

export const dissocCodeListsEditorSelectedItemInLevel = (level) => state => R.pipe(
  getCodeListsEditorSelectedItemsByLevelIndex,
  R.take(level.index > 0 ? level.index : 0), //reset selected items from level.index on
  newSelectedItemsByLevelIndex => R.assocPath(selectedItemsByLevelIndexPath, newSelectedItemsByLevelIndex)(state)
)(state)

export const dissocCodeListsEditorCodeList = R.dissocPath(editedCodeListPath)

