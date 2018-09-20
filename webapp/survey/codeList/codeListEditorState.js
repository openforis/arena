import * as R from 'ramda'

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
// action creators
// createCodeList => dispatch survey/codeList/update, dispatch => survey/codeListEdit/update , load first level and dispatch survey/codeListEdit/levelItems/update
// updateCodeList => dispatch survey/codeList/update
// deleteCodeList => dispatch survey/codeList/update

// createCodeListLevel => dispatch survey/codeList/update
// updateCodeListLevel => dispatch survey/codeList/update
// deleteCodeListLevel => dispatch survey/codeList/update

// createCodeListItem => dispatch survey/codeListEdit/levelItems/update
// updateCodeListItem => dispatch survey/codeListEdit/levelItems/update
// deleteCodeListItem => dispatch survey/codeListEdit/levelItems/update and remove dispatch survey/codeListEdit/activeLevelItem/update
// setCodeListItemForEdit => dispatch survey/codeListEdit/activeLevelItem/update , load or remove children and dispatch survey/codeListEdit/levelItems/update

// actions
// survey/codeList/update -- assoc or dissoc codeList
// survey/codeListEdit/levelItems/update
// survey/codeListEdit/activeLevelItem/update

const codeListsPath = ['codeLists']
const codeListEditPath = ['codeListEdit']
const codeListUUIDPath = R.append('uuid', codeListEditPath)
const activeLevelItemPath = R.concat(codeListEditPath, ['activeLevelItem'])
const levelItemsPath = R.append('levelItems', codeListEditPath)

// ========= READ

export const getCodeListsArray = R.pipe(
  R.path(codeListsPath),
  R.values,
)

export const getCodeListByUUID = uuid => R.path(R.append(uuid, codeListsPath))

export const getCodeListEditCodeList = state => R.pipe(
  R.path(codeListsPath),
  codeLists => R.prop(R.path(codeListUUIDPath)(state))(codeLists),
)(state)

const getActiveLevelItem = R.pipe(
  R.path(activeLevelItemPath),
  R.defaultTo([]),
)

export const getCodeListEditActiveLevelItem = levelIndex => state => R.pipe(
  getActiveLevelItem,
  R.prop(levelIndex),
  activeItemUUID => R.find(item => item.uuid === activeItemUUID, getCodeListEditLevelItemsArray(levelIndex)(state))
)(state)

export const getCodeListEditLevelItems = levelIndex => R.pipe(
  R.path(levelItemsPath),
  R.prop(levelIndex),
  R.defaultTo({}),
)

export const getCodeListEditLevelItemsArray = levelIndex => R.pipe(
  getCodeListEditLevelItems(levelIndex),
  R.values,
  R.sortBy(R.prop('index')),
)

export const getCodeListEditLevelItemByUUID = (levelIndex, itemUUID) => R.path(R.concat(levelItemsPath, [levelIndex, itemUUID]))

// ========== UPDATE

export const assocCodeListEdit = codeListUUID => R.assocPath(codeListEditPath, {uuid: codeListUUID})

export const dissocCodeListEdit = R.dissocPath(codeListEditPath)

export const assocCodeListEditLevelItems = (levelIndex, items) => state => R.pipe(
  R.path(R.append(levelIndex, levelItemsPath)),
  oldItems => R.merge(oldItems, items),
  //remove deleted items (null)
  updatedItems => R.reduce((acc, item) => item === null ? R.dissoc(item.uuid)(acc) : acc, updatedItems, R.values(updatedItems)),
  updatedItems => R.assocPath(R.append(levelIndex, levelItemsPath), updatedItems)(state),
)(state)

export const dissocCodeListEditLevelItems = (levelIndex) => R.dissocPath(R.append(levelIndex, levelItemsPath))

export const assocCodeListEditActiveLevelItem = (levelIndex, itemUUID) => state => R.pipe(
  dissocCodeListEditActiveLevelItem(levelIndex),
  getActiveLevelItem,
  R.assoc(levelIndex, itemUUID),
  updatedActiveItems => R.assocPath(activeLevelItemPath, updatedActiveItems)(state)
)(state)

export const dissocCodeListEditActiveLevelItem = (levelIndex) => state => R.pipe(
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
  R.path(levelItemsPath),
  //remove items in following levels
  itemsByLevel => R.reduce((acc, index) =>
      R.assoc(index, R.prop(index)(itemsByLevel), acc)
    , {})
  (R.filter(index => index < levelIndex)(R.keys(itemsByLevel))), //consider only previous levels items
  updatedItemsByLevel => R.assocPath(levelItemsPath, updatedItemsByLevel)(state)
)(state)

