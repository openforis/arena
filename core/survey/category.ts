import type {
  Category as ArenaCategory,
  CategoryItem as ArenaCategoryItem,
  CategoryLevel as ArenaCategoryLevel,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

import * as Validation from '@core/validation/validation'

import * as CategoryLevel from './categoryLevel'
import * as CategoryItem from './categoryItem'
import { ExtraPropDef, ExtraPropDefItem, ExtraPropDefItems } from './extraPropDef'

export const maxCategoryItemsInIndex = 1000

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  levels: 'levels',
  props: ObjectUtils.keys.props,
  items: 'items',
  itemsCount: 'itemsCount', // available only in data entry
  published: ObjectUtils.keys.published,
  levelsCount: 'levelsCount', // populated only on fetch
  validation: Validation.keys.validation,
}

export const keysProps = {
  name: 'name',
  designerNotes: 'designerNotes',
  itemExtraDef: 'itemExtraDef',
  reportingData: 'reportingData',
}

export const reportingDataItemExtraDefKeys = {
  area: 'area',
}

// name of the item extra prop def (of type geometryPoint) that makes a category exportable to GeoPackage
export const locationItemExtraDefName = 'location'

const samplingUnitsPlanCategoryName = 'sampling_units_plan'
// single source of truth for this name: other modules must import it from here rather than
// hard-coding the string or re-defining it
export const samplingPointDataCategoryName = 'sampling_point_data'
export const samplingPointDataWhispCategoryName = 'sampling_point_data_whisp'

// ========
// LEVELS
// ========

// ====== READ
export const { getProps, getPropsDraft, getPropsAndPropsDraft, getUuid, isPublished } = ObjectUtils
export const getName: (category: ArenaCategory) => string = ObjectUtils.getProp(keysProps.name, '')
export const getDesignerNotes: (category: ArenaCategory) => string = ObjectUtils.getProp(keysProps.designerNotes, '')
export const isReportingData: (category: ArenaCategory) => boolean = ObjectUtils.getProp(keysProps.reportingData, false)
export const { getValidation } = Validation

const getLevels = (category: ArenaCategory): Record<string, ArenaCategoryLevel> => A.propOr({}, keys.levels)(category)
const getLevelsValues = (category: ArenaCategory): ArenaCategoryLevel[] => Object.values(getLevels(category))
export const getLevelsArray = (category: ArenaCategory): ArenaCategoryLevel[] =>
  A.sortBy(A.prop('index'))(getLevelsValues(category))
export const getLevelByUuid =
  (uuid: string) =>
  (category: ArenaCategory): ArenaCategoryLevel | undefined =>
    getLevelsValues(category).find((level) => CategoryLevel.getUuid(level) === uuid)
export const getLevelsSize = (category: ArenaCategory): number => getLevelsValues(category).length
export const getLevelByIndex =
  (idx: number) =>
  (category: ArenaCategory): ArenaCategoryLevel | undefined =>
    A.path([keys.levels, idx])(category)

const getLevelsCount = (category: ArenaCategory): number =>
  Math.max(getLevelsArray(category).length, A.propOr(0, keys.levelsCount)(category))
export const isFlat = (category: ArenaCategory): boolean => getLevelsCount(category) === 1
export const isHierarchical = (category: ArenaCategory): boolean => !isFlat(category)

export const getLevelValidation = (levelIndex: number) =>
  A.pipe(getValidation, Validation.getFieldValidation(keys.levels), Validation.getFieldValidation(levelIndex))

export const getItemsCount = (category: ArenaCategory): number => A.propOr(-1, keys.itemsCount)(category)
export const getItemsCountOrLevelsItemsCount = (category: ArenaCategory): number =>
  getItemsCount(category) > 0
    ? getItemsCount(category)
    : getLevelsArray(category).reduce((acc, level) => acc + CategoryLevel.getItemsCount(level), 0)

export const isBigCategory = (category: ArenaCategory): boolean =>
  getItemsCountOrLevelsItemsCount(category) > maxCategoryItemsInIndex

// ====== UPDATE
export const assocProp =
  ({ key, value }: { key: string; value: unknown }) =>
  (category: ArenaCategory): ArenaCategory => {
    const categoryUpdated = ObjectUtils.setProp(key, value)(category)
    const validationUpdated = A.pipe(Validation.getValidation, Validation.dissocFieldValidation(key))(categoryUpdated)
    return Validation.assocValidation(validationUpdated)(categoryUpdated)
  }

// ==== CREATE
export const newLevel = (
  category: ArenaCategory,
  props: Record<string, unknown> = {},
  index: number = Object.keys(getLevels(category)).length
): ArenaCategoryLevel => ({
  [CategoryLevel.keys.uuid]: uuidv4(),
  [CategoryLevel.keys.categoryUuid]: ObjectUtils.getUuid(category),
  [CategoryLevel.keys.index]: index,
  [CategoryLevel.keys.props]: {
    [CategoryLevel.keysProps.name]: `level_${index + 1}`,
    ...props,
  },
})

const assocLevels =
  ({ levels }: { levels: Record<string, ArenaCategoryLevel> }) =>
  (category: ArenaCategory): ArenaCategory =>
    A.assoc(keys.levels, levels)(category)

export const assocLevelsArray = (array: ArenaCategoryLevel[]) =>
  assocLevels({ levels: ObjectUtils.toIndexedObj(array, 'index') })

export const assocLevel =
  ({ level }: { level: ArenaCategoryLevel }) =>
  (category: ArenaCategory): ArenaCategory => {
    // A.assoc keeps levels as array if they are an array
    const levelsUpdated = A.assoc(CategoryLevel.getIndex(level), level)(getLevels(category))
    return assocLevels({ levels: levelsUpdated })(category)
  }

// ========
// ITEMS
// ========

export const getItemLevelIndex =
  (item: ArenaCategoryItem) =>
  (category: ArenaCategory): number | undefined => {
    const levelUuid = CategoryItem.getLevelUuid(item)
    const level = getLevelByUuid(levelUuid)(category)
    return CategoryLevel.getIndex(level)
  }

export const isItemLeaf =
  (item: ArenaCategoryItem) =>
  (category: ArenaCategory): boolean =>
    getItemLevelIndex(item)(category) === getLevelsSize(category) - 1

export const getItemValidation = (item: ArenaCategoryItem) =>
  A.pipe(
    getValidation,
    Validation.getFieldValidation(keys.items),
    Validation.getFieldValidation(CategoryItem.getUuid(item))
  )

// ====== ITEMS extra def
export const getItemExtraDef: (category: ArenaCategory) => ExtraPropDefItems = ObjectUtils.getProp(
  keysProps.itemExtraDef,
  {}
)
export const getItemExtraDefsArray = (category: ArenaCategory): ExtraPropDefItem[] =>
  ExtraPropDef.extraDefsToArray(getItemExtraDef(category))
export const getItemExtraDefKeys = (category: ArenaCategory): string[] =>
  getItemExtraDefsArray(category).map(ExtraPropDef.getName)

// the extra prop def named 'location' of type geometryPoint, if the category has one
export const getLocationExtraDef = (category: ArenaCategory): ExtraPropDefItem | undefined =>
  getItemExtraDefsArray(category).find(
    (extraDef) =>
      ExtraPropDef.getName(extraDef) === locationItemExtraDefName &&
      ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.geometryPoint
  )

// true if the category has a 'location' extra prop, i.e. it is exportable to GeoPackage
export const hasLocationExtraProp = (category: ArenaCategory): boolean => Boolean(getLocationExtraDef(category))

// true if the category has a 'location' extra prop AND it is locked - i.e. converting it to a
// simple category (unlocking the prop) would actually change something
export const isLocationExtraPropLocked = (category: ArenaCategory): boolean => {
  const locationExtraDef = getLocationExtraDef(category)
  return Boolean(locationExtraDef) && ExtraPropDef.isLocked(locationExtraDef)
}

export const assocItemExtraDef = (extraDef: ExtraPropDefItems) => ObjectUtils.setProp(keysProps.itemExtraDef, extraDef)

// ========
// CATEGORY
// ========

// ====== CREATE
// creates a new category with the specified props and levels (by default, a single level)
export const newCategory = (
  props: Record<string, unknown> = {},
  levels: ArenaCategoryLevel[] | null = null
): ArenaCategory => {
  const category = {
    [keys.uuid]: uuidv4(),
    props,
  }
  // levels as array (indexed by position)
  return {
    ...category,
    [keys.levels]: levels || [newLevel(category as unknown as ArenaCategory)],
  } as unknown as ArenaCategory
}

export const assocItemsCount = (count: number) => A.assoc(keys.itemsCount, count)
export const setItemsCount = (count: number) => (category: ArenaCategory) => {
  category[keys.itemsCount] = count
}

// UTILS
export const isLevelDeleteAllowed =
  (level: ArenaCategoryLevel) =>
  (category: ArenaCategory): boolean =>
    !CategoryLevel.isPublished(level) && CategoryLevel.getIndex(level) === getLevelsArray(category).length - 1
export const isSamplingUnitsPlanCategory = (category: ArenaCategory): boolean =>
  getName(category) === samplingUnitsPlanCategoryName
export const isSamplingPointDataCategory = (category: ArenaCategory): boolean =>
  getName(category) === samplingPointDataCategoryName
export const isExtraPropDefReadOnly =
  (extraPropDef: ExtraPropDefItem) =>
  (category: ArenaCategory): boolean =>
    ExtraPropDef.isLocked(extraPropDef) ||
    (isReportingData(category) && ExtraPropDef.getName(extraPropDef) === reportingDataItemExtraDefKeys.area) ||
    (isSamplingPointDataCategory(category) && ExtraPropDef.getName(extraPropDef) === locationItemExtraDefName)
export const hasExtraDefs = (category: ArenaCategory): boolean => getItemExtraDefKeys(category).length > 0
