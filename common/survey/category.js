const R = require('ramda')
const {uuidv4} = require('../uuid')

const {getProp, toIndexedObj} = require('./surveyUtils')

const {getValidation, getFieldValidation} = require('../validation/validator')

const keys = {
  uuid: 'uuid',
  levels: 'levels',
  props: 'props'
}

const props = {
  name: 'name'
}

const levelKeys = {
  categoryUuid: 'categoryUuid',
  index: 'index'
}

const levelProps = {
  name: 'name'
}

const itemKeys = {
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid'
}

const itemProps = {
  code: 'code',
  labels: 'labels'
}

/**
 * CATEGORY
 */
// ====== CREATE
const newCategory = (props = {}) => {
  const category = {
    [keys.uuid]: uuidv4(),
    props,
  }
  return {
    ...category,
    [keys.levels]: [newLevel(category)]
  }
}

// ====== READ
const getUuid = R.prop(keys.uuid)
const getLevels = R.propOr([], keys.levels)
const getLevelsArray = R.pipe(
  getLevels,
  R.values,
  R.sortBy(R.prop('index'))
)

const getLevelByUuid = uuid => R.pipe(
  getLevelsArray,
  R.find(R.propEq('uuid', uuid)),
)
const getLevelByIndex = idx => R.path([keys.levels, idx])

// ====== UPDATE
const assocLevelsArray = array => R.assoc(keys.levels, toIndexedObj(array, 'index'))

/**
 * LEVEL
 */
// ====== CREATE
const newLevel = (category) => {
  const index = getLevelsArray(category).length

  return {
    [keys.uuid]: uuidv4(),
    [levelKeys.categoryUuid]: getUuid(category),
    [levelKeys.index]: index,
    [keys.props]: {
      name: 'level_' + (index + 1),
    }
  }
}
// ====== READ

/**
 * ITEM
 */
// ====== CREATE
const newItem = (levelUuid, parentItem = null, props = {}) => {
  return {
    [keys.uuid]: uuidv4(),
    [itemKeys.levelUuid]: levelUuid,
    [itemKeys.parentUuid]: parentItem ? parentItem.uuid : null,
    [keys.props]: props,
  }
}

// ====== READ
const getItemCode = getProp(itemProps.code)

const getItemLabels = getProp(itemProps.labels)

const getItemLabel = language =>
  item =>
    R.pipe(
      getItemLabels,
      R.prop(language),
      R.defaultTo(getItemCode(item))
    )(item)

const isItemLeaf = item =>
  category => R.pipe(
    R.prop(itemKeys.levelUuid),
    levelUuid => getLevelByUuid(levelUuid)(category),
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
  getUuid,
  getName: getProp(props.name),
  getLevelsArray,
  getLevelByIndex,

  // UPDATE
  assocLevelsArray: assocLevelsArray,

  // ====== LEVEL
  //CREATE
  newLevel,

  //READ
  getLevelName: getProp(levelProps.name),
  getLevelIndex: R.prop(levelKeys.index),
  getLevelValidation: levelIndex => R.pipe(
    getValidation,
    getFieldValidation(keys.levels),
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