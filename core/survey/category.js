const R = require('ramda')
const { uuidv4 } = require('@core/uuid')

const ObjectUtils = require('@core/objectUtils')

const Validation = require('@core/validation/validation')

const CategoryLevel = require('./categoryLevel')
const CategoryItem = require('./categoryItem')

const keys = {
  uuid: 'uuid',
  levels: 'levels',
  props: 'props',
  items: 'items',
  published: 'published',
}

const props = {
  name: 'name',
  itemExtraDef: 'itemExtraDef'
}

const itemExtraDefDataTypes = {
  text: 'text',
  number: 'number',
  geometryPoint: 'geometryPoint',
}

/**
 * CATEGORY
 */
// ====== CREATE
const newCategory = (props = {}, levels = null) => {
  const category = {
    [keys.uuid]: uuidv4(),
    props,
  }
  return {
    ...category,
    [keys.levels]: levels ? levels : [newLevel(category)]
  }
}

/**
 * LEVELS
 */
// ==== CREATE
const newLevel = (category, props = {}, index = R.pipe(getLevels, R.keys, R.length)(category)) => ({
  [CategoryLevel.keys.uuid]: uuidv4(),
  [CategoryLevel.keys.categoryUuid]: ObjectUtils.getUuid(category),
  [CategoryLevel.keys.index]: index,
  [CategoryLevel.keys.props]: {
    [CategoryLevel.keysProps.name]: 'level_' + (index + 1),
    ...props
  }
})

// ====== READ
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
const assocLevelsArray = array => R.assoc(keys.levels, ObjectUtils.toIndexedObj(array, 'index'))

const assocLevel = level =>
  category =>
    R.pipe(
      getLevelsArray,
      R.append(level),
      levels => assocLevelsArray(levels)(category)
    )(category)

/**
 * ITEMS
 */
const getItemLevelIndex = item =>
  category => R.pipe(
    CategoryItem.getLevelUuid,
    levelUuid => getLevelByUuid(levelUuid)(category),
    CategoryLevel.getIndex,
  )(item)

const isItemLeaf = item =>
  category =>
    getItemLevelIndex(item)(category) === getLevelsArray(category).length - 1

const getItemValidation = item => R.pipe(
  Validation.getValidation,
  Validation.getFieldValidation(keys.items),
  Validation.getFieldValidation(CategoryItem.getUuid(item)),
)

// ======= UPDATE

// UTILS
const isLevelDeleteAllowed = level => R.pipe(
  getLevelsArray,
  R.length,
  levelsCount => R.and(
    CategoryLevel.getIndex(level) > 0,
    CategoryLevel.getIndex(level) === (levelsCount - 1)
  )
)

module.exports = {
  props,
  keys,
  itemExtraDefDataTypes,

  // ======
  //CREATE
  newCategory,

  //READ
  getUuid: ObjectUtils.getUuid,
  getName: ObjectUtils.getProp(props.name, ''),
  getLevelsArray,
  getLevelByIndex,
  isPublished: R.propOr(false, keys.published),

  // UPDATE
  assocLevelsArray,
  assocLevel,

  // ====== LEVEL
  //CREATE
  newLevel,

  //READ
  getLevelValidation: levelIndex => R.pipe(
    Validation.getValidation,
    Validation.getFieldValidation(keys.levels),
    Validation.getFieldValidation(levelIndex),
  ),
  //UPDATE
  assocLevelName: name => ObjectUtils.setProp(CategoryLevel.keysProps.name, name),

  // ====== ITEMS

  getItemValidation,
  isItemLeaf,

  // ====== ITEMS extra def
  getItemExtraDef: ObjectUtils.getProp(props.itemExtraDef, {}),
  assocItemExtraDef: extraDef => ObjectUtils.setProp(props.itemExtraDef, extraDef),

  //UTILS
  isLevelDeleteAllowed,
}