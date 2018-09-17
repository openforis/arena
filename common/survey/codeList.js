const R = require('ramda')
const {uuidv4} = require('../uuid')

const levels = 'levels'
const items = 'items'

const newCodeList = () => ({
  uuid: uuidv4(),

  levels: [
    newCodeListLevel()
  ]
})

const newCodeListLevel = (codeListId = null, index = 0) => {
  return {
    uuid: uuidv4(),
    codeListId,
    index,
    props: {
      name: 'level_' + (index + 1),
    }
  }
}

const newCodeListItem = (levelId, parentId = null) => {
  return {
    uuid: uuidv4(),
    levelId,
    parentId,
  }
}

const getCodeListProps = R.prop('props')

const getCodeListName = R.pipe(
  getCodeListProps,
  R.prop('name'),
)

const getCodeListLevels = R.prop(levels)

const getCodeListLevelByUUID = levelUUID => R.pipe(
  getCodeListLevels,
  R.find(l => l.uuid === levelUUID),
)

const getCodeListItems = R.prop(items)

const getCodeListItemsArray = R.pipe(
  getCodeListItems,
  R.values,
)

const getCodeListItemsByParentId = parentId => R.pipe(
  getCodeListItemsArray,
  R.filter(item => item.parentId === parentId)
)

// UPDATE
const assocCodeListProp = (key, value) => codeList => R.pipe(
  getCodeListProps,
  R.assoc(key, value),
  props => R.assoc('props', props)(codeList)
)(codeList)

const assocCodeListLevel = level => codeList => R.pipe(
  getCodeListLevels,
  levels => level.index >= levels.length
    ? R.insert(level.index, level, levels)
    : R.update(level.index, level, levels),
  newLevels => R.assoc(levels, newLevels)(codeList),
)(codeList)

const assocCodeListLevelProp = (key, value) => R.assoc(key, value)

const assocCodeListItem = item => codeList => R.pipe(
  getCodeListItems,
  R.assoc(item.uuid, item),
  updatedItems => R.assoc(items, updatedItems)(codeList),
)(codeList)

module.exports = {
  //CREATE
  newCodeList,
  newCodeListLevel,
  newCodeListItem,

  //READ
  getCodeListName,
  getCodeListLevelByUUID,
  getCodeListItemsByParentId,
  getCodeListLevelName: R.path(['props', 'name']),
  getCodeListItemCode: R.path(['props', 'code']),
  getCodeListItemLabel: language => R.path(['props', 'labels', language]),

  //UPDATE
  assocCodeListProp,
  assocCodeListLevel,
  assocCodeListItem,
  assocCodeListLevelProp,
}