import * as R from 'ramda'

const codeListsEditorPath = ['codeListsEditor']

const editedCodeListPath = R.concat(codeListsEditorPath, ['codeList'])

const selectedItemsByLevelIndexPath = R.concat(codeListsEditorPath, ['itemsByLevelIndex'])

export const getCodeListsEditorEditedCodeList = R.path(editedCodeListPath)

export const getCodeListsEditorSelectedItemsByLevelIndex = R.pipe(
  R.path(selectedItemsByLevelIndexPath),
  R.defaultTo([]),
)

export const assocCodeListsEditorEditedCodeList = list => R.assocPath(editedCodeListPath, list)

export const assocCodeListsEditorSelectedItemInLevel = (level, item) => state => R.pipe(
  getCodeListsEditorSelectedItemsByLevelIndex,
  R.take(level.index - 1), //reset selected items from (level.index - 1) on
  R.set(level.index, item),
  newSelectedItemsByLevelIndex => R.assocPath(selectedItemsByLevelIndexPath, newSelectedItemsByLevelIndex)(state)
)

export const dissocCodeListsEditorSelectedItemInLevel = (level) => state => R.pipe(
  getCodeListsEditorSelectedItemsByLevelIndex,
  R.take(level.index - 1),
  newSelectedItemsByLevelIndex => R.assocPath(selectedItemsByLevelIndexPath, newSelectedItemsByLevelIndex)(state)
)

export const dissocCodeListsEditorEditedCodeList = R.dissocPath(editedCodeListPath)

