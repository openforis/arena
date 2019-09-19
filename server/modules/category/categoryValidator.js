const R = require('ramda')

const Category = require('../../../common/survey/category')
const CategoryLevel = require('../../../common/survey/categoryLevel')
const CategoryItem = require('../../../common/survey/categoryItem')
const Validator = require('../../../common/validation/validator')
const Validation = require('../../../common/validation/validation')
const ObjectUtils = require('../../../common/objectUtils')

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

// ====== LEVELS

const levelValidators = (levels, itemsByParentUuid) => ({
  [`${ObjectUtils.keys.props}.${CategoryLevel.props.name}`]: [
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

const validateItemCodeUniqueness = itemsByCode =>
  (propName, item) => {
    const itemsWithSameCode = itemsByCode[CategoryItem.getCode(item)]

    return itemsWithSameCode.length > 1
      ? { key: Validation.messageKeys.categoryEdit.codeDuplicate }
      : null
  }

const itemValidators = (isLeaf, itemsByParentUuid, siblingsByCode) => ({
  [`${ObjectUtils.keys.props}.${CategoryItem.props.code}`]: [
    Validator.validateRequired(Validation.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validation.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsByCode)
  ],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemsByParentUuid)],
})

const getChildrenItems = (itemsByParentUuid, parentItemUuid) =>
  R.propOr([], parentItemUuid)(itemsByParentUuid)

const validateNotEmptyChildrenItems = (isLeaf, itemsByParentUuid) =>
  (propName, item) =>
    !isLeaf && R.isEmpty(getChildrenItems(itemsByParentUuid, CategoryItem.getUuid(item)))
      ? { key: Validation.messageKeys.categoryEdit.childrenEmpty }
      : null

const validateNotEmptyFirstLevelItems = itemsByParentUuid => (propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(getChildrenItems(itemsByParentUuid, null))
    ? { key: Validation.messageKeys.categoryEdit.itemsEmpty }
    : null

const validateItem = (category, siblings, siblingsByUuid, siblingsByCode, itemsByParentUuid) => async item => {
  const itemUuid = CategoryItem.getUuid(item)

  const isLeaf = Category.isItemLeaf(item)(category)

  const validation = await Validator.validate(item, itemValidators(isLeaf, itemsByParentUuid, siblingsByCode))

  if (isLeaf || !Validation.isValid(Validation.getFieldValidation(keys.children)(validation))) {
    return { [itemUuid]: validation }
  } else {
    //children are not empty, validate each item

    const childValidations = await validateItemsByParentUuid(category, itemsByParentUuid, itemUuid)

    const combinedValidation =
      Validation.isValid(childValidations)
        ? validation
        : R.pipe(
        Validation.setValid(false),
        Validation.setField(
          keys.children,
          Validation.newInstance(false, {}, [{ key: Validation.messageKeys.categoryEdit.itemsInvalid }])
        )
        )(validation)

    return R.pipe(
      Validation.getFieldValidations,
      fieldValidations => ({
        ...fieldValidations,
        [itemUuid]: combinedValidation
      })
    )(childValidations)
  }
}

const validateItemsByParentUuid = async (category, itemsByParentUuid, parentItemUuid) => {
  const children = getChildrenItems(itemsByParentUuid, parentItemUuid)
  const childrenByCode = R.groupBy(CategoryItem.getCode)(children)
  const childrenByUuid = R.groupBy(R.prop(CategoryItem.keys.uuid))(children)

  const childrenValidationsArr = await Promise.all(children.map(
    validateItem(category, children, childrenByUuid, childrenByCode, itemsByParentUuid, parentItemUuid)
  ))

  //merge children validations
  let childrenValid = true
  const childrenValidationsMerged = childrenValidationsArr.reduce((validationsAcc, childValidations) => {
      Object.entries(childValidations).forEach(
        ([childUuid, childValidation]) => {
          if (!Validation.isValid(childValidation)) {
            validationsAcc[childUuid] = childValidation
            childrenValid = false
          }
        })
      return validationsAcc
    },
    {}
  )

  return Validation.newInstance(
    childrenValid,
    childrenValidationsMerged,
    childrenValid ? [] : [{ key: Validation.messageKeys.categoryEdit.childrenInvalid }]
  )
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  [`${ObjectUtils.keys.props}.${Category.props.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(categories)
  ],
})

const validateCategoryProps = async (categories, category) =>
  await Validator.validate(category, categoryValidators(categories))

const validateCategory = async (categories, category, items) => {
  const itemsByParentUuid = R.groupBy(R.prop(CategoryItem.keys.parentUuid))(items)

  const categoryValidation = await validateCategoryProps(categories, category)
  const levelsValidation = await validateLevels(category, itemsByParentUuid)
  const itemsValidation = await validateItemsByParentUuid(category, itemsByParentUuid, null)

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

module.exports = {
  validateCategory,
}