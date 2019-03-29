const R = require('ramda')
const Promise = require('bluebird')

const {
  errorKeys,
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword,
  getFieldValidation,
  isValid,
  isValidationValid
} = require('../../../common/validation/validator')

const Category = require('../../../common/survey/category')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const CategoryItem = require('../../../common/survey/categoryItem')

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(levels)],
  'items': [validateNotEmptyFirstLevelItems(itemsByParentUuid)]
})

const validateLevel = async (levels, itemsByParentUuid, level) =>
  await validate(level, levelValidators(levels, itemsByParentUuid))

const validateLevels = async (category, itemsByParentUuid) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(
    levels.map(
      async level => await validateLevel(levels, itemsByParentUuid, level)
    )
  )

  const invalid = R.any(R.propEq('valid', false))(validations)
  return {
    valid: !invalid,
    fields: Object.assign({}, validations)
  }

}

// ====== ITEMS

const itemValidators = (isLeaf, itemsByParentUuid, siblings) => ({
  'props.code': [validateRequired, validateNotKeyword, validateItemPropUniqueness(siblings)],
  'children': [validateNotEmptyChildrenItems(isLeaf, itemsByParentUuid)],
})

const getChildrenItems = (itemsByParentUuid, parentItemUuid) =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemsByParentUuid) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(getChildrenItems(itemsByParentUuid, CategoryItem.getUuid(item)))
      ? errorKeys.empty
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getChildrenItems(itemsByParentUuid, null))
    ? errorKeys.empty
    : null

const validateItem = async (category, itemsByParentUuid, parentItemUuid, itemUuid) => {
  const siblings = getChildrenItems(itemsByParentUuid, parentItemUuid)
  const item = R.find(R.propEq('uuid', itemUuid))(siblings)

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await validate(item, itemValidators(isLeaf, itemsByParentUuid, siblings))

  if (isLeaf) {
    return { [itemUuid]: validation }
  } else if (isValid(getFieldValidation('children')(validation))) {
    //children are not empty, validate each item

    const childValidations = await validateItemsByParentUuid(category, itemsByParentUuid, itemUuid)

    const combinedValidation =
      childValidations.valid
        ? validation
        : (
          R.pipe(
            R.assocPath(['fields', 'children'], {
              valid: false,
              errors: ['invalid']
            }),
            R.assoc('valid', false)
          )(validation)
        )

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

  const childValidations = await Promise.all(children.map(
    async child => await validateItem(category, itemsByParentUuid, parentItemUuid, CategoryItem.getUuid(child))
  ))

  const childrenValid =
    R.none(
      childValidation => R.propEq('valid', false, R.values(childValidation)[0])
      , childValidations
    )

  return {
    fields: R.mergeAll(childValidations),
    valid: childrenValid,
    errors: !childrenValid ? ['invalidChildren'] : []
  }
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(categories)],
})

const validateCategoryProps = async (categories, category) =>
  await validate(category, categoryValidators(categories))

const validateCategory = async (categories, category, items) => {
  const itemsByParentUuid = R.groupBy(R.prop(CategoryItem.keys.parentUuid))(items)

  const categoryValidation = await validateCategoryProps(categories, category)
  const levelsValidation = await validateLevels(category, itemsByParentUuid)
  const itemsValidation = await validateItemsByParentUuid(category, itemsByParentUuid, null)

  return {
    ...categoryValidation,
    fields: {
      ...categoryValidation.fields,
      levels: levelsValidation,
      items: itemsValidation
    },
    valid: R.all(isValidationValid, [categoryValidation, levelsValidation, itemsValidation])
  }
}

module.exports = {
  validateCategory,
}