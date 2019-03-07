const R = require('ramda')
const Promise = require('bluebird')

const {
  errorKeys,
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword,
  getFieldValidation,
  isValid
} = require('../../../common/validation/validator')

const Category = require('../../../common/survey/category')

// ====== LEVELS

const levelValidators = (levels, items) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(levels)],
  'items': [validateNotEmptyFirstLevelItems(items)]
})

const validateLevel = async (levels, items, level) =>
  await validate(level, levelValidators(levels, items))

const validateLevels = async (category, items) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(
    levels.map(
      async level => await validateLevel(levels, items, level)
    )
  )

  const invalid = R.any(R.propEq('valid', false))(validations)
  return {
    valid: !invalid,
    fields: Object.assign({}, validations)
  }

}

// ====== ITEMS

const itemValidators = (isLeaf, items, siblings) => ({
  'props.code': [validateRequired, validateNotKeyword, validateItemPropUniqueness(siblings)],
  'children': [validateNotEmptyChildrenItems(isLeaf, items)],
})

const getChildrenItems = (items, parentItemUuid) =>
  items.filter(R.propEq('parentUuid', parentItemUuid))

const validateNotEmptyChildrenItems = (isLeaf, items) => (propName, item) =>
  !isLeaf && R.isEmpty(getChildrenItems(items, item.uuid))
    ? errorKeys.empty
    : null

const validateNotEmptyFirstLevelItems = items => (propName, level) =>
  Category.getLevelIndex(level) === 0 && R.isEmpty(getChildrenItems(items, null))
    ? errorKeys.empty
    : null

const validateItem = async (category, items, itemUuid) => {
  const item = R.find(R.propEq('uuid', itemUuid))(items)

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await validate(item, itemValidators(isLeaf, items, getChildrenItems(items, item.parentUuid)))

  if (isLeaf) {
    return {[item.uuid]: validation}
  } else if (isValid(getFieldValidation('children')(validation))) {
    //children are not empty, validate each item

    const childValidations = await validateItemsByParentUuid(category, items, item.uuid)

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
      item.uuid,
      {...combinedValidation}
    )(childValidations.fields)
  } else {
    return validation
  }
}

const validateItemsByParentUuid = async (category, items, parentItemUuid) => {
  const children = getChildrenItems(items, parentItemUuid)

  const childValidations = await Promise.all(children.map(
    async child => await validateItem(category, items, child.uuid)
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
  const categoryValidation = await validateCategoryProps(categories, category)
  const levelsValidation = await validateLevels(category, items)
  const itemsValidation = await validateItemsByParentUuid(category, items, null)

  const valid = categoryValidation.valid && levelsValidation.valid && itemsValidation.valid

  return R.pipe(
    R.assoc('valid', valid),
    R.assocPath(['fields', 'levels'], levelsValidation),
    R.assocPath(['fields', 'items'], itemsValidation),
  )(categoryValidation)

}

module.exports = {
  validateCategory,
}