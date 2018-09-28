const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
  setProp,
  getProp,
  toIndexedObj,
} = require('./surveyUtils')
const {
  getValidation,
  getFieldValidation,
} = require('../validation/validator')
const levels = 'levels'

/**
 * CODE LIST
 */
// ====== CREATE
const newCodeList = () => ({
  uuid: uuidv4(),
  levels: {0: newCodeListLevel()}
})

// ====== READ
const getCodeListLevels = R.prop(levels)
const getCodeListLevelsArray = R.pipe(
  getCodeListLevels,
  R.values,
  R.sortBy(R.prop('index'))
)

const getCodeListLevelsLength = R.pipe(
  getCodeListLevels,
  R.keys,
  R.length
)

const getCodeListLevelById = id => R.pipe(
  getCodeListLevelsArray,
  R.find(R.propEq('id', id)),
)
const getCodeListLevelByIndex = idx => R.path(['levels', idx])

// ====== UPDATE
const assocCodeListLevelsArray = array => R.assoc(levels, toIndexedObj(array, 'index'))
const assocCodeListLevel = level => R.assocPath([levels, level.index], level)

// ====== DELETE
const dissocCodeListLevel = levelIndex => R.dissocPath([levels, R.toString(levelIndex)])

/**
 * CODE LIST LEVEL
 */
// ====== CREATE
const newCodeListLevel = (codeList) => {
  const index = codeList ? getCodeListLevelsArray(codeList).length : 0

  return {
    uuid: uuidv4(),
    codeListId: R.propOr(null, 'id')(codeList),
    index,
    props: {
      name: 'level_' + (index + 1),
    }
  }
}
// ====== READ

// ====== UPDATE
const assocCodeListLevelProp = (levelIndex, key, value) => R.assocPath(['levels', levelIndex, 'props', key], value)

/**
 * CODE LIST ITEM
 */
// ====== CREATE
const newCodeListItem = (levelId, parentId = null) => {
  return {
    uuid: uuidv4(),
    levelId,
    parentId,
  }
}

const getCodeListItemLabels = getProp('labels')

const getCodeListItemLabel = language => R.pipe(getCodeListItemLabels, R.prop(language))

// UTILS
const isCodeListLevelDeleteAllowed = level => R.pipe(
  getCodeListLevelsArray,
  R.length,
  levelsCount => R.and(
    level.index > 0,
    level.index === (levelsCount - 1)
  )
)

module.exports = {
  // ====== CODE LIST
  //CREATE
  newCodeList,

  //READ
  getCodeListName: getProp('name'),
  getCodeListLevelsArray,
  getCodeListLevelById,
  getCodeListLevelByIndex,

  // UPDATE
  assocCodeListProp: setProp,
  assocCodeListLevelsArray,
  assocCodeListLevel,

  // DELETE
  dissocCodeListLevel,

  // ====== CODELIST LEVEL
  //CREATE
  newCodeListLevel,
  //READ
  getCodeListLevelsLength,
  getCodeListLevelName: getProp('name'),
  getCodeListLevelValidation: levelIndex => R.pipe(
    getValidation,
    getFieldValidation('levels'),
    getFieldValidation(levelIndex),
  ),
  //UPDATE
  assocCodeListLevelProp,
  assocCodeListLevelValidation: (levelIndex, validation) => R.assocPath(['validation', 'levels', levelIndex], validation),
  dissocCodeListLevelValidation: levelIndex => R.dissocPath(['validation', 'levels', R.toString(levelIndex)]),
  // DELETE

  // ====== CODELIST ITEM
  //CREATE
  newCodeListItem,

  //READ
  getCodeListItemId: R.propOr(null, 'id'),
  getCodeListItemCode: getProp('code'),
  getCodeListItemLabels,
  getCodeListItemLabel,

  //UPDATE
  assocCodeListItemProp: setProp,

  //UTILS
  isCodeListLevelDeleteAllowed,
}