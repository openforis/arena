const R = require('ramda')

const Category = require('../../../common/survey/category')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const CategoryItem = require('../../../common/survey/categoryItem')
const Validator = require('../../../common/validation/validator')
const Validation = require('../../../common/validation/validation')

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  'props.name': [
    Validator.validateRequired(Validator.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validator.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validator.messageKeys.categoryEdit.levelDuplicate)(levels)
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

  return Validation.newInstance(R.all(Validation.isValid, validations), Object.assign({}, validations))
}

// ====== ITEMS

const validateItemCodeUniqueness = itemsByCode =>
  (propName, item) => {
    const itemsWithSameCode = itemsByCode[CategoryItem.getCode(item)]

    return itemsWithSameCode.length > 1
      ? { key: Validator.messageKeys.categoryEdit.codeDuplicate }
      : null
  }

const itemValidators = (isLeaf, itemsByParentUuid, siblingsByCode) => ({
  'props.code': [
    Validator.validateRequired(Validator.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validator.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsByCode)
  ],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemsByParentUuid)],
})

const getChildrenItems = (itemsByParentUuid, parentItemUuid) =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemsByParentUuid) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(getChildrenItems(itemsByParentUuid, CategoryItem.getUuid(item)))
      ? { key: Validator.messageKeys.categoryEdit.childrenEmpty }
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getChildrenItems(itemsByParentUuid, null))
    ? { key: Validator.messageKeys.categoryEdit.itemsEmpty }
    : null

const validateItem = async (category, siblings, siblingsByUuid, siblingsByCode, itemsByParentUuid, parentItemUuid, itemUuid) => {
  const item = siblingsByUuid[itemUuid][0]

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await Validator.validate(item, itemValidators(isLeaf, itemsByParentUuid, siblingsByCode))

  if (isLeaf) {
    return { [itemUuid]: validation }
  } else if (Validator.isValid(Validation.getFieldValidation(keys.children)(validation))) {
    //children are not empty, validate each item

    const childValidations = await validateItemsByParentUuid(category, itemsByParentUuid, itemUuid)

    const combinedValidation =
      Validation.isValid(childValidations)
        ? validation
        : (
          Validation.assocFieldValidation(
            keys.children,
            Validation.newInstance(false, {}, [{ key: Validator.messageKeys.categoryEdit.itemsInvalid }])
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
  const childrenByCode = R.groupBy(CategoryItem.getCode)(children)
  const childrenByUuid = R.groupBy(R.prop(CategoryItem.keys.uuid))(children)

  const childValidationsArr = await Promise.all(children.map(
    async child => await validateItem(category, children, childrenByUuid, childrenByCode, itemsByParentUuid, parentItemUuid, CategoryItem.getUuid(child))
  ))

  const childValidations = R.mergeAll(childValidationsArr)

  const childrenValid = R.pipe(
    R.values,
    R.all(Validation.isValid)
  )(childValidations)

  return {
    fields: childValidations,
    valid: childrenValid,
    errors: childrenValid ? [] : [{ key: Validator.messageKeys.categoryEdit.childrenInvalid }]
  }
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  'props.name': [
    Validator.validateRequired(Validator.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validator.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validator.messageKeys.nameDuplicate)(categories)
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
    ...Validation.newInstance(
      R.all(Validation.isValid, [categoryValidation, levelsValidation, itemsValidation]),
      {
        ...Validation.getFieldValidations(categoryValidation),
        levels: levelsValidation,
        items: itemsValidation
      }
    ),
  }
}

module.exports = {
  validateCategory,
}