import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import Queue from '@core/queue'

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

const validateItemCodeUniqueness = itemSiblingsAndSelf =>
  (propName, item) => {
    const isUnique = R.none(
      itemSibling => itemSibling !== item && CategoryItem.getCode(itemSibling) === CategoryItem.getCode(item)
    )(itemSiblingsAndSelf)

    return isUnique
      ? null
      : { key: Validation.messageKeys.categoryEdit.codeDuplicate }
  }

const itemValidators = (isLeaf, itemChildren, itemSiblingsAndSelf) => ({
  [`${CategoryItem.keys.props}.${CategoryItem.props.code}`]: [
    Validator.validateRequired(Validation.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validation.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(itemSiblingsAndSelf)
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

  // visit the items from the first to the lowest level
  // validate first the leaf items, then the 
  const visitedUuids = new Set()
  const queue = new Queue()

  // start with the first level items
  queue.enqueueItems(getItemChildren(null)(itemsByParentUuid))

  while (!queue.isEmpty()) {
    const item = queue.dequeue()
    const itemUuid = CategoryItem.getUuid(item)
    const isLeaf = Category.isItemLeaf(item)(category)
    const itemChildren = getItemChildren(itemUuid)(itemsByParentUuid)
    const visited = visitedUuids.has(itemUuid)

    let validation = null

    if (isLeaf || visited || R.isEmpty(itemChildren)) {
      // validate leaf items or items without children or items already visited (all descendants have been already visited)
      const itemSiblingsAndSelf = getItemChildren(CategoryItem.getParentUuid(item))(itemsByParentUuid)

      validation = await Validator.validate(item, itemValidators(isLeaf, itemChildren, itemSiblingsAndSelf))
    }

    if (!isLeaf) {
      if (visited) {
        // all descendants have been validate, add children validation to the item validation
        const childrenValid = R.all(
          item => Validation.isValid(itemsValidationsByUuid[CategoryItem.getUuid(item)])
        )(itemChildren)

        if (!childrenValid) {
          validation = R.pipe(
            R.defaultTo(Validation.newInstance()),
            Validation.setValid(false),
            Validation.setErrors([{ key: Validation.messageKeys.categoryEdit.childrenInvalid }])
          )(validation)
        }
      } else {
        // postpone item validation, validate descendant items first
        queue.enqueueItems(itemChildren)
        // enque item again: it will be visited and validater later on
        queue.enqueue(item)
      }
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
