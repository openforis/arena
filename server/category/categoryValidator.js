const R = require('ramda')
const Promise = require('bluebird')

const {
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword
} = require('../../common/validation/validator')

const Category = require('../../common/survey/category')

// ====== LEVELS

const levelValidators = (levels) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(levels)],
})

const validateLevel = async (levels, level) =>
  await validate(level, levelValidators(levels))

const validateLevels = async (category) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(
    levels.map(
      async level => await validateLevel(levels, level)
    )
  )

  const invalid = R.any(R.propEq('valid', false))(validations)
  return {
    valid: !invalid,
    fields: Object.assign({}, validations)
  }

}

// ====== ITEMS

const itemValidators = (items) => ({
  'props.code': [validateRequired, validateNotKeyword, validateItemPropUniqueness(items)],
})

const getChildrenItems = (items, parentItemUuid) =>
  items.filter(R.propEq('parentUuid', parentItemUuid))

const validateItem = async (category, items, itemUuid) => {
  const item = R.find(R.propEq('uuid', itemUuid))(items)
  const validation = await validate(item, itemValidators(getChildrenItems(items, item.parentUuid)))

  const isLeaf = Category.isItemLeaf(item)(category)

  if (isLeaf) {
    return {[item.uuid]: validation}
  } else {
    const childValidations = await validateItemsByParentUuid(category, items, item.uuid)

    const childrenValid = childValidations.valid

    return R.assoc(
      item.uuid,
      {
        ...validation,
        valid: validation.valid && childrenValid,
        errors: childrenValid
          ? validation.errors
          : validation.errors ? [...validation.errors, ...childValidations.errors] : childValidations.errors
      }
    )(childValidations.fields)
  }

}

const validateItemsByParentUuid = async (category, items, parentItemUuid) => {
  const children = getChildrenItems(items, parentItemUuid)
  const emptyChildren = R.isEmpty(children)

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
    valid: childrenValid && !emptyChildren,
    errors: emptyChildren ? ['emptyChildren'] : !childrenValid ? ['invalidChildren'] : []
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
  const levelsValidation = await validateLevels(category)
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