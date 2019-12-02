import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  [`${CategoryLevel.keys.props}.${CategoryLevel.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.categoryEdit.levelDuplicate)(levels)
  ],
  [keys.items]: [validateNotEmptyFirstLevelItems(itemsByParentUuid)]
})

const validateLevel = (levels, itemsByParentUuid) => async level =>
  await Validator.validate(level, levelValidators(levels, itemsByParentUuid))

const validateLevels = async (category, itemsByParentUuid) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(
    levels.map(validateLevel(levels, itemsByParentUuid))
  )

  const valid = R.all(Validation.isValid, validations)

  return valid
    ? null
    : Validation.newInstance(
      false,
      Object.assign({}, validations),
      [{ key: Validation.messageKeys.categoryEdit.levelsInvalid }]
    )
}

// ====== ITEMS

const validateItemCodeUniqueness = siblingsAndSelfByCode =>
  (propName, item) => {
    const isUnique = R.pipe(
      R.prop(CategoryItem.getCode(item)),
      R.length,
      R.equals(1)
    )(siblingsAndSelfByCode)

    return isUnique
      ? null
      : { key: Validation.messageKeys.categoryEdit.codeDuplicate }
  }

const itemValidators = (isLeaf, itemChildren, siblingsAndSelfByCode) => ({
  [`${CategoryItem.keys.props}.${CategoryItem.props.code}`]: [
    Validator.validateRequired(Validation.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validation.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsAndSelfByCode)
  ],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemChildren)],
})

const getItemChildren = parentItemUuid => itemsByParentUuid =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemChildren) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(itemChildren)
      ? { key: Validation.messageKeys.categoryEdit.childrenEmpty }
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getItemChildren(null)(itemsByParentUuid))
    ? { key: Validation.messageKeys.categoryEdit.itemsEmpty }
    : null

const validateItems = async (category, itemsByParentUuid) => {
  const itemsValidationsByUuid = {}

  // visit the items from the first to the lowest level (DFS)
  // validate first the leaf items, then up to the first level
  const stack = []

  // keep track of already visited items: if not leaf, they will be validated only when already visited
  const visitedUuids = new Set()

  const addItemsToStack = items => {
    // group sibling items by code to optimize item code uniqueness check
    // do it only one time for every sibling
    const siblingsAndSelfByCode = R.groupBy(CategoryItem.getCode, items)
    stack.push(...R.map(
      item => ({
        item,
        siblingsAndSelfByCode
      }),
      items
    ))
  }

  // start with the first level items
  const itemsFirstLevel = getItemChildren(null)(itemsByParentUuid)
  addItemsToStack(itemsFirstLevel)

  while (!R.isEmpty(stack)) {
    const { item, siblingsAndSelfByCode } = stack[stack.length - 1] // do not pop item: it can be visited again
    const itemUuid = CategoryItem.getUuid(item)
    const isLeaf = Category.isItemLeaf(item)(category)
    const itemChildren = getItemChildren(itemUuid)(itemsByParentUuid)
    const visited = visitedUuids.has(itemUuid)

    let validation = null

    if (isLeaf || visited || R.isEmpty(itemChildren)) {
      // validate leaf items or items without children or items already visited (all descendants have been already visited)
      validation = await Validator.validate(item, itemValidators(isLeaf, itemChildren, siblingsAndSelfByCode))
    }

    if (isLeaf || R.isEmpty(itemChildren)) {
      stack.pop() // it won't be visited again, remove it from stack
    } else if (visited) {
      // all descendants have been validated, add children validation to the item validation
      const childrenValid = R.all(
        itemChild => Validation.isValid(itemsValidationsByUuid[CategoryItem.getUuid(itemChild)])
      )(itemChildren)

      if (!childrenValid) {
        validation = R.pipe(
          R.defaultTo(Validation.newInstance()),
          Validation.setValid(false),
          Validation.setErrors([{ key: Validation.messageKeys.categoryEdit.childrenInvalid }])
        )(validation)
      }
      stack.pop()
    } else {
      // keep the item in the stack, postpone item validation, validate descendant items first
      addItemsToStack(itemChildren)
    }
    // keep only invalid validations
    if (!Validation.isValid(validation))
      itemsValidationsByUuid[itemUuid] = validation

    visitedUuids.add(itemUuid)
  }

  return Validation.newInstance(
    R.isEmpty(itemsValidationsByUuid),
    itemsValidationsByUuid
  )
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  [`${Category.keys.props}.${Category.props.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(categories)
  ],
})

const validateCategoryProps = async (categories, category) =>
  await Validator.validate(category, categoryValidators(categories))

export const validateCategory = async (categories, category, items) => {
  const itemsByParentUuid = R.groupBy(CategoryItem.getParentUuid)(items)

  const categoryValidation = await validateCategoryProps(categories, category)
  const levelsValidation = await validateLevels(category, itemsByParentUuid)
  const itemsValidation = await validateItems(category, itemsByParentUuid)

  return R.pipe(
    Validation.setValid(R.all(Validation.isValid, [categoryValidation, levelsValidation, itemsValidation])),
    R.unless(
      R.always(Validation.isValid(levelsValidation)),
      Validation.setField(keys.levels, levelsValidation)
    ),
    R.unless(
      R.always(Validation.isValid(itemsValidation)),
      Validation.setField(keys.items, itemsValidation)
    ),
  )(categoryValidation)
}
