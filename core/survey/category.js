import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

import * as Validation from '@core/validation/validation'

import * as CategoryLevel from './categoryLevel'
import * as CategoryItem from './categoryItem'

export const keys = {
  uuid: 'uuid',
  levels: 'levels',
  props: 'props',
  items: 'items',
  published: 'published',
}

export const props = {
  name: 'name',
  itemExtraDef: 'itemExtraDef',
}

export const itemExtraDefDataTypes = {
  text: 'text',
  number: 'number',
  geometryPoint: 'geometryPoint',
}

/**
 * CATEGORY
 */
// ====== CREATE
export const newCategory = (props = {}, levels = null) => {
  const category = {
    [keys.uuid]: uuidv4(),
    props,
  }
  return {
    ...category,
    [keys.levels]: levels || [newLevel(category)],
  }
}

/**
 * LEVELS
 */
// ==== CREATE
export const newLevel = (category, props = {}, index = R.pipe(getLevels, R.keys, R.length)(category)) => ({
  [CategoryLevel.keys.uuid]: uuidv4(),
  [CategoryLevel.keys.categoryUuid]: ObjectUtils.getUuid(category),
  [CategoryLevel.keys.index]: index,
  [CategoryLevel.keys.props]: {
    [CategoryLevel.keysProps.name]: `level_${index + 1}`,
    ...props,
  },
})

// ====== READ
export const { getUuid } = ObjectUtils
export const getName = ObjectUtils.getProp(props.name, '')
export const getValidation = Validation.getValidation

const getLevels = R.propOr([], keys.levels)
export const getLevelsArray = R.pipe(getLevels, R.values, R.sortBy(R.prop('index')))

export const getLevelByUuid = (uuid) => R.pipe(getLevelsArray, R.find(R.propEq('uuid', uuid)))
export const getLevelByIndex = (idx) => R.path([keys.levels, idx])

export const isPublished = R.propOr(false, keys.published)

export const getLevelValidation = (levelIndex) =>
  R.pipe(getValidation, Validation.getFieldValidation(keys.levels), Validation.getFieldValidation(levelIndex))

// ====== UPDATE
export const assocLevelsArray = (array) => R.assoc(keys.levels, ObjectUtils.toIndexedObj(array, 'index'))

export const assocLevel = (level) => (category) =>
  R.pipe(getLevelsArray, R.append(level), (levels) => assocLevelsArray(levels)(category))(category)

export const assocLevelName = (name) => ObjectUtils.setProp(CategoryLevel.keysProps.name, name)

/**
 * ITEMS
 */
const getItemLevelIndex = (item) => (category) =>
  R.pipe(CategoryItem.getLevelUuid, (levelUuid) => getLevelByUuid(levelUuid)(category), CategoryLevel.getIndex)(item)

export const isItemLeaf = (item) => (category) =>
  getItemLevelIndex(item)(category) === getLevelsArray(category).length - 1

export const getItemValidation = (item) =>
  R.pipe(
    getValidation,
    Validation.getFieldValidation(keys.items),
    Validation.getFieldValidation(CategoryItem.getUuid(item))
  )

// ====== ITEMS extra def
export const getItemExtraDef = ObjectUtils.getProp(props.itemExtraDef, {})
export const assocItemExtraDef = (extraDef) => ObjectUtils.setProp(props.itemExtraDef, extraDef)

// ======= UPDATE

// UTILS
export const isLevelDeleteAllowed = (level) =>
  R.pipe(getLevelsArray, R.length, (levelsCount) =>
    R.and(CategoryLevel.getIndex(level) > 0, CategoryLevel.getIndex(level) === levelsCount - 1)
  )
