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

const getCodeListLevelById = id => R.pipe(
  getCodeListLevels,
  R.find(R.propEq('id', id)),
)

const getCodeListLevelByUUID = uuid => R.pipe(
  getCodeListLevels,
  R.find(R.propEq('uuid', uuid)),
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

const getCodeListItemByUUID = uuid => R.pipe(
  getCodeListItems,
  R.prop(uuid),
)

const getCodeListItemLabels = R.path(['props', 'labels'])

const getCodeListItemLabel = language => R.pipe(getCodeListItemLabels, R.prop(language))

// UPDATE
const assocCodeListLevel = level => codeList => R.pipe(
  getCodeListLevels,
  levels => level.index >= levels.length
    ? R.insert(level.index, level, levels)
    : R.update(level.index, level, levels),
  newLevels => R.assoc(levels, newLevels)(codeList),
)(codeList)

const assocProp = (key, value) => R.assocPath(['props', key], value)

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
  getCodeListLevelById,
  getCodeListLevelByUUID,
  getCodeListItemsByParentId,
  getCodeListItemByUUID,
  getCodeListLevelName: R.path(['props', 'name']),
  getCodeListItemCode: R.path(['props', 'code']),
  getCodeListItemLabels,
  getCodeListItemLabel,

  //UPDATE
  assocCodeListLevel,
  assocCodeListItem,
  assocCodeListProp: assocProp,
  assocCodeListLevelProp: assocProp,
  assocCodeListItemProp: assocProp,
}