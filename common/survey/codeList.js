const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
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
const newCodeList = (props = {}) => ({
  uuid: uuidv4(),
  levels: {0: newCodeListLevel()},
  props,
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

/**
 * CODE LIST ITEM
 */
// ====== CREATE
const newCodeListItem = (levelId, parentItem = null, props = {}) => {
  return {
    uuid: uuidv4(),
    levelId,
    parentUuid: parentItem ? parentItem.uuid : null,
    props,
  }
}

// ====== READ
const getCodeListItemCode = getProp('code')

const getCodeListItemLabels = getProp('labels')

const getCodeListItemLabel = language =>
  codeListItem =>
    R.pipe(
      getCodeListItemLabels,
      R.prop(language),
      R.defaultTo(getCodeListItemCode(codeListItem))
    )(codeListItem)

const isCodeListItemLeaf = item =>
  codeList => R.pipe(
    R.prop('levelId'),
    levelId => getCodeListLevelById(levelId)(codeList),
    level => getCodeListLevelsArray(codeList).length === level.index + 1
  )(item)

const getCodeListItemValidation = item => R.pipe(
  getValidation,
  getFieldValidation('items'),
  getFieldValidation(item.uuid),
)

// ======= UPDATE

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
  getCodeListLevelByIndex,

  // UPDATE
  assocCodeListLevelsArray,

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

  // ====== CODELIST ITEM
  //CREATE
  newCodeListItem,

  //READ
  getCodeListItemCode,
  getCodeListItemLabels,
  getCodeListItemLabel,
  getCodeListItemValidation,
  isCodeListItemLeaf,

  //UTILS
  isCodeListLevelDeleteAllowed,
}