import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

import * as Validation from '@core/validation/validation'

import * as CategoryLevel from './categoryLevel'
import * as CategoryItem from './categoryItem'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  levels: 'levels',
  props: ObjectUtils.keys.props,
  items: 'items',
  published: ObjectUtils.keys.published,
  levelsCount: 'levelsCount', // populated only on fetch
}

export const keysProps = {
  name: 'name',
  itemExtraDef: 'itemExtraDef',
  reportingData: 'reportingData',
}

export const reportingDataItemExtraDefKeys = {
  area: 'area',
}

// ========
// LEVELS
// ========

// ====== READ
export const { getProps, getPropsDraft, getUuid, isPublished } = ObjectUtils
export const getName = ObjectUtils.getProp(keysProps.name, '')
export const isReportingData = ObjectUtils.getProp(keysProps.reportingData, false)
export const { getValidation } = Validation

const getLevels = R.propOr({}, keys.levels)
export const getLevelsArray = R.pipe(getLevels, R.values, R.sortBy(R.prop('index')))
export const getLevelByUuid = (uuid) => R.pipe(getLevelsArray, R.find(R.propEq('uuid', uuid)))
export const getLevelByIndex = (idx) => R.path([keys.levels, idx])

const getLevelsCount = (category) => Math.max(getLevelsArray(category).length, R.propOr(0, keys.levelsCount)(category))
export const isFlat = (category) => getLevelsCount(category) === 1
export const isHierarchical = (category) => !isFlat(category)

export const getLevelValidation = (levelIndex) =>
  R.pipe(getValidation, Validation.getFieldValidation(keys.levels), Validation.getFieldValidation(levelIndex))

// ====== UPDATE
export const assocProp =
  ({ key, value }) =>
  (category) => {
    const categoryUpdated = ObjectUtils.setProp(key, value)(category)
    const validationUpdated = R.pipe(Validation.getValidation, Validation.dissocFieldValidation(key))(categoryUpdated)
    return Validation.assocValidation(validationUpdated)(categoryUpdated)
  }

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

const assocLevels = ({ levels }) => R.assoc(keys.levels, levels)

export const assocLevelsArray = (array) => assocLevels({ levels: ObjectUtils.toIndexedObj(array, 'index') })

export const assocLevel =
  ({ level }) =>
  (category) => {
    const levelsUpdated = R.pipe(getLevels, R.assoc(CategoryLevel.getIndex(level), level))(category)
    return assocLevels({ levels: levelsUpdated })(category)
  }

// ========
// ITEMS
// ========

export const getItemLevelIndex = (item) => (category) =>
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
export const getItemExtraDef = ObjectUtils.getProp(keysProps.itemExtraDef, {})
export const getItemExtraDefKeys = (category) => {
  const itemExtraDef = getItemExtraDef(category)
  return Object.keys(itemExtraDef)
}
export const getItemExtraDefsArray = (category) =>
  // add uuid and name to each extra def item definition and put them in a array
  Object.entries(getItemExtraDef(category)).map(([name, item]) => ({
    ...item,
    uuid: uuidv4(),
    name,
  }))

export const assocItemExtraDef = (extraDef) => ObjectUtils.setProp(keysProps.itemExtraDef, extraDef)

// ========
// CATEGORY
// ========

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

// UTILS
export const isLevelDeleteAllowed = (level) => (category) =>
  !CategoryLevel.isPublished(level) && CategoryLevel.getIndex(level) === getLevelsArray(category).length - 1
