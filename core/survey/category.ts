import * as R from 'ramda';
import { uuidv4 } from '../uuid';
import ObjectUtils from '../objectUtils';
import Validation from '../validation/validation';
import CategoryLevel from './categoryLevel';
import CategoryItem from './categoryItem';

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
export interface ICategoryProps {}
export interface ICategory {
  uuid: string;
  levels?: ICategoryLevel[];
  props: ICategoryProps;
  items?: any[];
  published?: boolean;

  parentUuid?: string; // TODO can this really exist here??
}
const newCategory: (props?: ICategoryProps) => ICategory
= (props = {}) => {
  const category = {
    uuid: uuidv4(),
    props,
  }
  return {
    uuid: category.uuid,
    props,
    levels: [newLevel(category)]
  }
}

/**
 * LEVELS
 */
// ==== CREATE
export interface ICategoryLevelProps { name: string; }
export interface ICategoryLevel {
  uuid: string;
  categoryUuid: string;
  index: number;
  props: ICategoryLevelProps;
}
const newLevel: (category: ICategory, props?: {}, index?: number) => ICategoryLevel
= (category, props = {}, index = R.pipe(getLevels, R.keys, R.length)(category)) => ({
  uuid: uuidv4(),
  categoryUuid: ObjectUtils.getUuid(category),
  index,
  props: {
    name: `level_${index + 1}`,
    ...props
  }
})

// ====== READ
const getLevels: (obj: any) => ICategoryLevel[] = R.propOr([], keys.levels)
const getLevelsArray = R.pipe(
  getLevels,
  R.values,
  R.sortBy(R.prop('index'))
)

const getLevelByUuid = (uuid: string) => R.pipe(
  getLevelsArray,
  R.find(R.propEq('uuid', uuid)),
)
const getLevelByIndex = (idx: number) => R.path([keys.levels, idx])

// ====== UPDATE
const assocLevelsArray = (array: unknown[]) => R.assoc(keys.levels, ObjectUtils.toIndexedObj(array, 'index'))

const assocLevel = (level: any) =>
  (category: any) =>
    R.pipe(
      getLevelsArray,
      R.append(level),
      levels => assocLevelsArray(levels)(category)
    )(category)

/**
 * ITEMS
 */
const getItemLevelIndex = (item: any) =>
  (  category: any) => R.pipe(
    CategoryItem.getLevelUuid,
    levelUuid => getLevelByUuid(levelUuid)(category),
    CategoryLevel.getIndex,
  )(item)

const isItemLeaf = (item: any) =>
  (  category: any) =>
    getItemLevelIndex(item)(category) === getLevelsArray(category).length - 1

const getItemValidation = (item: any) => R.pipe(
  Validation.getValidation,
  Validation.getFieldValidation(keys.items),
  Validation.getFieldValidation(CategoryItem.getUuid(item)),
)

// ======= UPDATE

// UTILS
const isLevelDeleteAllowed = (level: ICategoryLevel) => R.pipe(
  getLevelsArray,
  R.length,
  levelsCount => R.and(
    CategoryLevel.getIndex(level) > 0,
    CategoryLevel.getIndex(level) === (levelsCount - 1)
  )
)

export default {
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
  getLevelValidation: (levelIndex: any) => R.pipe(
    Validation.getValidation,
    Validation.getFieldValidation(keys.levels),
    Validation.getFieldValidation(levelIndex),
  ),
  //UPDATE
  assocLevelName: (name: any) => ObjectUtils.setProp(CategoryLevel.keysProps.name, name),

  // ====== ITEMS

  getItemValidation,
  isItemLeaf,

  // ====== ITEMS extra def
  getItemExtraDef: ObjectUtils.getProp(props.itemExtraDef, {}),
  assocItemExtraDef: (extraDef: any) => ObjectUtils.setProp(props.itemExtraDef, extraDef),

  //UTILS
  isLevelDeleteAllowed,
};
