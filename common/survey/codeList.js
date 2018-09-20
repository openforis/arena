const R = require('ramda')
const {uuidv4} = require('../uuid')

const {toUUIDIndexedObj} = require('./surveyUtils')

const levels = 'levels'
const items = 'items'

const newCodeList = () => ({
  uuid: uuidv4(),

  levels: {
    0: newCodeListLevel()
  }
})

const newCodeListLevel = (codeList) => {
  const levels = getCodeListLevelsArray(codeList)
  const index = levels.length

  return {
    uuid: uuidv4(),
    codeListId: codeList.id,
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

const getCodeListLevelsArray = R.pipe(
  R.prop(levels),
  R.values,
  R.sortBy(R.prop('index'))
)

const getCodeListLevelById = id => R.pipe(
  getCodeListLevelsArray,
  R.find(R.propEq('id', id)),
)

const getCodeListLevelByUUID = uuid => R.pipe(
  getCodeListLevelsArray,
  R.find(R.propEq('uuid', uuid)),
)

const getCodeListItems = R.prop(items)

const getCodeListItemByUUID = uuid => R.pipe(
  getCodeListItems,
  R.prop(uuid),
)

const getCodeListItemLabels = R.path(['props', 'labels'])

const getCodeListItemLabel = language => R.pipe(getCodeListItemLabels, R.prop(language))

// UPDATE
const assocCodeListLevelsArray = array => R.assoc(levels, toUUIDIndexedObj(array))

const assocCodeListLevel = level => R.assocPath([levels, level.index], level)

const assocProp = (key, value) => R.assocPath(['props', key], value)

const assocCodeListItem = item => codeList => R.pipe(
  getCodeListItems,
  R.assoc(item.uuid, item),
  updatedItems => R.assoc(items, updatedItems)(codeList),
)(codeList)

const dissocCodeListLevel = levelIndex => R.dissocPath([levels, levelIndex])

// UTILS
const isCodeListLevelDeleteAllowed = level =>  R.pipe(
  getCodeListLevelsArray,
  R.length,
  levelsCount => R.and(
    level.index > 0,
    level.index === (levelsCount - 1)
  )
)

module.exports = {
  //CREATE
  newCodeList,
  newCodeListLevel,
  newCodeListItem,

  //READ
  getCodeListName,
  getCodeListLevelsArray,
  getCodeListLevelById,
  getCodeListLevelByUUID,
  getCodeListItemByUUID,
  getCodeListLevelName: R.path(['props', 'name']),
  getCodeListItemId: R.propOr(null, 'id'),
  getCodeListItemUUID: R.propOr(null, 'uuid'),
  getCodeListItemCode: R.path(['props', 'code']),
  getCodeListItemLabels,
  getCodeListItemLabel,

  //UPDATE
  assocCodeListLevelsArray,
  assocCodeListLevel,
  assocCodeListItem,
  assocCodeListProp: assocProp,
  assocCodeListLevelProp: assocProp,
  assocCodeListItemProp: assocProp,
  dissocCodeListLevel,

  //UTILS
  isCodeListLevelDeleteAllowed,
}