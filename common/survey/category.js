const R = require('ramda')
const {uuidv4} = require('../uuid')

const {getProp, toIndexedObj} = require('./surveyUtils')

const {getValidation, getFieldValidation} = require('../validation/validator')

const levels = 'levels'

/**
 * CATEGORY
 */
// ====== CREATE
const newCategory = (props = {}) => {
  const category = {
    uuid: uuidv4(),
    props,
  }
  return {
    ...category,
    levels: [newLevel(category)]
  }
}

// ====== READ
const getLevels = R.propOr([], levels)
const getLevelsArray = R.pipe(
  getLevels,
  R.values,
  R.sortBy(R.prop('index'))
)

const getLevelById = id => R.pipe(
  getLevelsArray,
  R.find(R.propEq('id', id)),
)
const getLevelByIndex = idx => R.path(['levels', idx])

// ====== UPDATE
const assocLevelsArray = array => R.assoc(levels, toIndexedObj(array, 'index'))

/**
 * LEVEL
 */
// ====== CREATE
const newLevel = (category) => {
  const index = getLevelsArray(category).length

  return {
    uuid: uuidv4(),
    categoryId: R.prop('id')(category),
    index,
    props: {
      name: 'level_' + (index + 1),
    }
  }
}
// ====== READ

/**
 * ITEM
 */
// ====== CREATE
const newItem = (levelId, parentItem = null, props = {}) => {
  return {
    uuid: uuidv4(),
    levelId,
    parentUuid: parentItem ? parentItem.uuid : null,
    props,
  }
}

// ====== READ
const getItemCode = getProp('code')

const getItemLabels = getProp('labels')

const getItemLabel = language =>
  item =>
    R.pipe(
      getItemLabels,
      R.prop(language),
      R.defaultTo(getItemCode(item))
    )(item)

const isItemLeaf = item =>
  category => R.pipe(
    R.prop('levelId'),
    levelId => getLevelById(levelId)(category),
    level => getLevelsArray(category).length === level.index + 1
  )(item)

const getItemValidation = item => R.pipe(
  getValidation,
  getFieldValidation('items'),
  getFieldValidation(item.uuid),
)

// ======= UPDATE

// UTILS
const isLevelDeleteAllowed = level => R.pipe(
  getLevelsArray,
  R.length,
  levelsCount => R.and(
    level.index > 0,
    level.index === (levelsCount - 1)
  )
)

module.exports = {
  // ======
  //CREATE
  newCategory,

  //READ
  getName: getProp('name'),
  getLevelsArray,
  getLevelByIndex,

  // UPDATE
  assocLevelsArray: assocLevelsArray,

  // ====== LEVEL
  //CREATE
  newLevel,

  //READ
  getLevelName: getProp('name'),
  getLevelIndex: R.prop('index'),
  getLevelValidation: levelIndex => R.pipe(
    getValidation,
    getFieldValidation('levels'),
    getFieldValidation(levelIndex),
  ),
  //UPDATE

  // ====== ITEM
  //CREATE
  newItem,

  //READ
  getItemCode,
  getItemLabels,
  getItemLabel,
  getItemValidation,
  isItemLeaf,

  //UTILS
  isLevelDeleteAllowed,
}