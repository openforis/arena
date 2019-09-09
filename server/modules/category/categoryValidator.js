const R = require('ramda')

const Category = require('../../../common/survey/category')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const CategoryItem = require('../../../common/survey/categoryItem')
const Validator = require('../../../common/validation/validator')
const ValidatorErrorKeys = require('../../../common/validation/validatorErrorKeys')

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  'props.name': [
    Validator.validateRequired(ValidatorErrorKeys.nameRequired),
    Validator.validateNotKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(ValidatorErrorKeys.categoryEdit.levelDuplicate)(levels)
  ],
  [keys.items]: [validateNotEmptyFirstLevelItems(itemsByParentUuid)]
})

const validateLevel = async (levels, itemsByParentUuid, level) =>
  await Validator.validate(level, levelValidators(levels, itemsByParentUuid))

const validateLevels = async (category, itemsByParentUuid) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(
    levels.map(
      async level => await validateLevel(levels, itemsByParentUuid, level)
    )
  )

  return {
    [Validator.keys.valid]: R.all(Validator.isValidationValid, validations),
    [Validator.keys.fields]: Object.assign({}, validations)
  }

}

// ====== ITEMS

const validateItemCodeUniqueness = itemsByCode =>
  (propName, item) => {
    const itemsWithSameCode = itemsByCode[CategoryItem.getCode(item)]

    return itemsWithSameCode.length > 1
      ? { key: ValidatorErrorKeys.categoryEdit.codeDuplicate }
      : null
  }

const itemValidators = (isLeaf, itemsByParentUuid, siblingsByCode) => ({
  'props.code': [
    Validator.validateRequired(ValidatorErrorKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(ValidatorErrorKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsByCode)
  ],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemsByParentUuid)],
})

const getChildrenItems = (itemsByParentUuid, parentItemUuid) =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemsByParentUuid) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(getChildrenItems(itemsByParentUuid, CategoryItem.getUuid(item)))
      ? { key: ValidatorErrorKeys.categoryEdit.childrenEmpty }
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getChildrenItems(itemsByParentUuid, null))
    ? { key: ValidatorErrorKeys.categoryEdit.itemsEmpty }
    : null

const validateItem = async (category, siblings, siblingsByUuid, siblingsByCode, itemsByParentUuid, parentItemUuid, itemUuid) => {
  const item = siblingsByUuid[itemUuid][0]

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await Validator.validate(item, itemValidators(isLeaf, itemsByParentUuid, siblingsByCode))

  if (isLeaf) {
    return { [itemUuid]: validation }
  } else if (Validator.isValid(Validator.getFieldValidation(keys.children)(validation))) {
    //children are not empty, validate each item

    const childValidations = await validateItemsByParentUuid(category, itemsByParentUuid, itemUuid)

    const combinedValidation =
      Validator.isValidationValid(childValidations)
        ? validation
        : Validator.assocFieldValidation(keys.children, {
          [Validator.keys.valid]: false,
          [Validator.keys.errors]: [{ key: ValidatorErrorKeys.categoryEdit.itemsInvalid }]
        })(validation)

    return R.assoc(
      itemUuid,
      { ...combinedValidation }
    )(childValidations.fields)
  } else {
    return validation
  }
}

const validateItemsByParentUuid = async (category, itemsByParentUuid, parentItemUuid) => {
  const children = getChildrenItems(itemsByParentUuid, parentItemUuid)
  const childrenByCode = R.groupBy(CategoryItem.getCode)(children)
  const childrenByUuid = R.groupBy(R.prop(CategoryItem.keys.uuid))(children)

  const childValidationsArr = await Promise.all(children.map(
    async child => await validateItem(category, children, childrenByUuid, childrenByCode, itemsByParentUuid, parentItemUuid, CategoryItem.getUuid(child))
  ))

  const childValidations = R.mergeAll(childValidationsArr)

  const childrenValid = R.pipe(
    R.values,
    R.all(Validator.isValidationValid)
  )(childValidations)

  return {
    fields: childValidations,
    valid: childrenValid,
    errors: childrenValid ? [] : [{ key: ValidatorErrorKeys.categoryEdit.childrenInvalid }]
  }
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  'props.name': [
    Validator.validateRequired(ValidatorErrorKeys.nameRequired),
    Validator.validateNotKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(ValidatorErrorKeys.nameDuplicate)(categories)
  ],
})

const validateCategoryProps = async (categories, category) =>
  await Validator.validate(category, categoryValidators(categories))

const validateCategory = async (categories, category, items) => {
  const itemsByParentUuid = R.groupBy(R.prop(CategoryItem.keys.parentUuid))(items)

  const categoryValidation = await validateCategoryProps(categories, category)
  const levelsValidation = await validateLevels(category, itemsByParentUuid)
  const itemsValidation = await validateItemsByParentUuid(category, itemsByParentUuid, null)

  return {
    ...categoryValidation,
    [Validator.keys.fields]: {
      ...categoryValidation[Validator.keys.fields],
      levels: levelsValidation,
      items: itemsValidation
    },
    [Validator.keys.valid]: R.all(Validator.isValidationValid, [categoryValidation, levelsValidation, itemsValidation])
  }
}

module.exports = {
  validateCategory,
}