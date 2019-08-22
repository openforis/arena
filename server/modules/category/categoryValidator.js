const R = require('ramda')

const Category = require('../../../common/survey/category')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const CategoryItem = require('../../../common/survey/categoryItem')
const Validator = require('../../../common/validation/validator')

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

const keysErrors = {
  childrenEmpty: 'categoryEdit.validationErrors.childrenEmpty',
  childrenInvalid: 'categoryEdit.validationErrors.childrenInvalid',
  codeDuplicate: 'categoryEdit.validationErrors.codeDuplicate',
  codeNotKeyword: 'categoryEdit.validationErrors.codeNotKeyword',
  codeRequired: 'categoryEdit.validationErrors.codeRequired',
  itemsInvalid: 'categoryEdit.validationErrors.itemsInvalid',
  itemsEmpty: 'categoryEdit.validationErrors.itemsEmpty',
  levelDuplicate: 'categoryEdit.validationErrors.levelDuplicate',
  nameDuplicate: 'categoryEdit.validationErrors.nameDuplicate',
  nameNotKeyword: 'categoryEdit.validationErrors.nameNotKeyword',
  nameRequired: 'categoryEdit.validationErrors.nameRequired',
}

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  'props.name': [Validator.validateRequired(keysErrors.nameRequired), Validator.validateNotKeyword(keysErrors.nameNotKeyword),
    Validator.validateItemPropUniqueness(keysErrors.levelDuplicate)(levels)],
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

const itemValidators = (isLeaf, itemsByParentUuid, siblings) => ({
  'props.code': [Validator.validateRequired(keysErrors.codeRequired), Validator.validateNotKeyword(keysErrors.codeNotKeyword),
    Validator.validateItemPropUniqueness(keysErrors.codeDuplicate)(siblings)],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemsByParentUuid)],
})

const getChildrenItems = (itemsByParentUuid, parentItemUuid) =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemsByParentUuid) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(getChildrenItems(itemsByParentUuid, CategoryItem.getUuid(item)))
      ? { key: keysErrors.childrenEmpty }
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getChildrenItems(itemsByParentUuid, null))
    ? { key: keysErrors.itemsEmpty }
    : null

const validateItem = async (category, itemsByParentUuid, parentItemUuid, itemUuid) => {
  const siblings = getChildrenItems(itemsByParentUuid, parentItemUuid)
  const item = R.find(R.propEq('uuid', itemUuid))(siblings)

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await Validator.validate(item, itemValidators(isLeaf, itemsByParentUuid, siblings))

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
          [Validator.keys.errors]: [{ key: keysErrors.itemsInvalid }]
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

  const childValidationsArr = await Promise.all(children.map(
    async child => await validateItem(category, itemsByParentUuid, parentItemUuid, CategoryItem.getUuid(child))
  ))

  const childValidations = R.mergeAll(childValidationsArr)

  const childrenValid = R.pipe(
    R.values,
    R.all(Validator.isValidationValid)
  )(childValidations)

  return {
    fields: childValidations,
    valid: childrenValid,
    errors: childrenValid ? [] : [{ key: keysErrors.childrenInvalid }]
  }
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  'props.name': [Validator.validateRequired(keysErrors.nameRequired), Validator.validateNotKeyword(keysErrors.nameNotKeyword),
    Validator.validateItemPropUniqueness(keysErrors.nameDuplicate)(categories)],
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