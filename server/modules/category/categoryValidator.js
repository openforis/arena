import * as R from 'ramda'

import { Points, Promises } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

const keys = {
  children: 'children',
  items: 'items',
  levels: 'levels',
}

// ====== LEVELS

const validateNotEmptyFirstLevelItems = (itemsCache) => (_propName, level) =>
  CategoryLevel.getIndex(level) === 0 && R.isEmpty(itemsCache.getFirstLevelItems())
    ? { key: Validation.messageKeys.categoryEdit.itemsEmpty }
    : null

const levelValidators = (levels, itemsCache) => ({
  [`${CategoryLevel.keys.props}.${CategoryLevel.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.categoryEdit.levelDuplicate)(levels),
  ],
  [keys.items]: [validateNotEmptyFirstLevelItems(itemsCache)],
})

const validateLevel = (levels, itemsCache) => async (level) =>
  Validator.validate(level, levelValidators(levels, itemsCache))

const validateLevels = async (category, itemsCache) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(levels.map(validateLevel(levels, itemsCache)))

  const valid = R.all(Validation.isValid, validations)

  return valid
    ? null
    : Validation.newInstance(false, { ...validations }, [{ key: Validation.messageKeys.categoryEdit.levelsInvalid }])
}

// ====== ITEMS

const validateItemCodeUniqueness = (siblingsAndSelfByCode) => (_propName, item) => {
  const isUnique = siblingsAndSelfByCode[CategoryItem.getCode(item)]?.length === 1
  return isUnique ? null : { key: Validation.messageKeys.categoryEdit.codeDuplicate }
}

const validateNotEmptyChildrenItems = (isLeaf, itemChildren) => () =>
  !isLeaf && R.isEmpty(itemChildren)
    ? { key: Validation.messageKeys.categoryEdit.childrenEmpty, severity: ValidationResult.severity.warning }
    : null

const itemValidators = (isLeaf, itemChildren, siblingsAndSelfByCode) => ({
  [`${CategoryItem.keys.props}.${CategoryItem.keysProps.code}`]: [
    Validator.validateRequired(Validation.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validation.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsAndSelfByCode),
  ],
  [keys.children]: [validateNotEmptyChildrenItems(isLeaf, itemChildren)],
})

const _extraPropValidators = {
  [ExtraPropDef.dataTypes.number]: ({ key, extra }) =>
    Validator.validateNumber(Validation.messageKeys.categoryEdit.itemExtraPropInvalidNumber, { key })(key, extra),
  [ExtraPropDef.dataTypes.geometryPoint]: ({ key, extra, srsIndex }) => {
    const point = Points.parse(extra[key])
    if (point && Points.isValid(point, srsIndex)) {
      return null
    }
    return ValidationResult.newInstance(Validation.messageKeys.categoryEdit.itemExtraPropInvalidGeometryPoint, { key })
  },
  [ExtraPropDef.dataTypes.text]: () => null,
}

const _validateItemExtraProps =
  ({ extraDefs, validation, srsIndex }) =>
  (item) => {
    const _validateItemExtraProp = ({ key, extra }) => {
      if (StringUtils.isBlank(extra[key])) {
        return null
      }
      const extraDef = extraDefs[key]
      const extraDefType = extraDef[ExtraPropDef.keys.dataType]
      return _extraPropValidators[extraDefType]({ key, extra, srsIndex })
    }

    const extra = CategoryItem.getExtra(item)
    return extra
      ? R.pipe(
          R.keys,
          R.reduce((accValidation, key) => {
            const validationResult = _validateItemExtraProp({ key, extra })
            return R.unless(
              R.always(R.isNil(validationResult)),
              Validation.assocFieldValidation(
                `${CategoryItem.keysProps.extra}_${key}`,
                Validation.newInstance(false, {}, [validationResult])
              )
            )(accValidation)
          }, validation)
        )(extra)
      : validation
  }

const validateAllItems = async ({ survey, category, itemsCache, onProgress = null, stopIfFn = null }) => {
  const itemsToValidate = itemsCache.getFirstLevelItems()
  return validateItemsAndDescendants({ survey, category, itemsCache, itemsToValidate, onProgress, stopIfFn })
}

const _addChildrenValidation = ({ itemsValidationsByUuid, itemChildren, validation }) => {
  const childrenValid = R.all((itemChild) =>
    Validation.isValid(itemsValidationsByUuid[CategoryItem.getUuid(itemChild)])
  )(itemChildren)

  if (!childrenValid) {
    const childrenHasErrors = itemChildren.some((itemChild) => {
      const childValidation = itemsValidationsByUuid[CategoryItem.getUuid(itemChild)]
      return Validation.isError(childValidation)
    })
    const validationResult = { key: Validation.messageKeys.categoryEdit.childrenInvalid }
    validation = R.pipe(
      R.defaultTo(Validation.newInstance()),
      Validation.setValid(false),
      childrenHasErrors ? Validation.setErrors([validationResult]) : Validation.setWarnings([validationResult])
    )(validation)
  }
  return validation
}

const _createItemsInvalidValidationResult = ({ errorFound, itemsValidationsByUuid }) => {
  const validationResult = { key: Validation.messageKeys.categoryEdit.itemsInvalid }
  const errors = errorFound ? [validationResult] : []
  const warnings = errorFound ? [] : [validationResult]
  return Validation.newInstance(false, { ...itemsValidationsByUuid }, errors, warnings)
}

const validateItemsAndDescendants = async ({
  survey,
  category,
  itemsCache,
  itemsToValidate,
  onProgress = null,
  stopIfFn = null,
}) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const srsIndex = Survey.getSRSIndex(surveyInfo)
  const extraDefs = Category.getItemExtraDef(category)

  const itemsValidationsByUuid = {}
  let errorFound = false

  // Visit the items from the first to the lowest level (DFS)
  // validate first the leaf items, then up to the first level
  const stack = []

  // Keep track of already visited items: if not leaf, they will be validated only when already visited
  const visitedUuids = {}

  const total = itemsCache.items.length
  let processed = 0

  const pushItems = (items) => {
    // Group sibling items by code to optimize item code uniqueness check
    // do it only one time for every sibling
    const siblingsAndSelfByCode = ObjectUtils.groupByProp(CategoryItem.getCode)(items)
    items.forEach((item) => {
      item.siblingsAndSelfByCode = siblingsAndSelfByCode
      stack.push(item)
    })
  }

  const popItem = (item) => {
    delete item['siblingsAndSelfByCode']
    stack.pop()
    processed++
    onProgress?.({ total, processed })
  }

  pushItems(itemsToValidate)

  while (!R.isEmpty(stack) && !stopIfFn?.()) {
    const item = stack[stack.length - 1] // Do not pop item: it can be visited again
    const { siblingsAndSelfByCode } = item
    const itemUuid = CategoryItem.getUuid(item)
    const isLeaf = Category.isItemLeaf(item)(category)
    const itemChildren = itemsCache.getItemChildren(itemUuid)
    const visited = !!visitedUuids[itemUuid]

    let validation = null

    if (visited || R.isEmpty(itemChildren)) {
      // Validate leaf items or items without children or items already visited (all descendants have been already visited)
      /* eslint-disable no-await-in-loop */
      validation = await Validator.validate(item, itemValidators(isLeaf, itemChildren, siblingsAndSelfByCode))

      validation = _validateItemExtraProps({ extraDefs, validation, srsIndex })(item)

      // It won't be visited again, remove it from stack
      popItem(item)
    }

    if (!R.isEmpty(itemChildren)) {
      if (visited) {
        // All descendants have been validated, add children validation to the item validation
        validation = _addChildrenValidation({ itemsValidationsByUuid, itemChildren, validation })
      } else {
        // Keep the item in the stack, postpone item validation, validate descendant items first
        pushItems(itemChildren)
      }
    }

    // Keep only invalid validations
    if (!Validation.isValid(validation)) {
      itemsValidationsByUuid[itemUuid] = validation
      errorFound = errorFound || Validation.isError(validation)
    }
    visitedUuids[itemUuid] = true
  }
  const valid = R.isEmpty(itemsValidationsByUuid)
  if (valid) return null

  return _createItemsInvalidValidationResult({ errorFound, itemsValidationsByUuid })
}

// ====== CATEGORY

const categoryValidators = (categories) => ({
  [`${Category.keys.props}.${Category.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(categories),
  ],
})

const validateCategoryProps = async (categories, category) =>
  Validator.validate(category, categoryValidators(categories))

export const validateCategory = async ({
  survey,
  categories,
  category,
  items,
  validateLevels: _validateLevels = true,
  validateItems: _validateItems = true,
  onProgress = null,
  stopIfFn = null,
}) => {
  const itemsCache = _validateLevels || _validateItems ? new ItemsCache(items) : null
  const categoryValidation = await validateCategoryProps(categories, category)
  const prevValidation = Category.getValidation(category)

  const levelsValidation = _validateLevels
    ? await validateLevels(category, itemsCache)
    : Validation.getFieldValidation(keys.levels)(prevValidation)

  const itemsValidation = _validateItems
    ? await validateAllItems({ survey, category, itemsCache, onProgress, stopIfFn })
    : Validation.getFieldValidation(keys.items)(prevValidation)

  return R.pipe(
    Validation.setValid(R.all(Validation.isValid, [categoryValidation, levelsValidation, itemsValidation])),
    R.unless(R.always(Validation.isValid(levelsValidation)), Validation.setField(keys.levels, levelsValidation)),
    R.unless(R.always(Validation.isValid(itemsValidation)), Validation.setField(keys.items, itemsValidation))
  )(categoryValidation)
}

export const validateItems = async ({ category, itemsToValidate }) => {
  const prevValidation = Category.getValidation(category)
  const siblingsAndSelfByCode = ObjectUtils.groupByProp(CategoryItem.getCode)(itemsToValidate)
  const prevItemsValidation = Validation.getFieldValidation(keys.items)(prevValidation)
  let itemsValidationUpdated = prevItemsValidation

  const _validateItem = async (itm) => {
    const itemUuid = CategoryItem.getUuid(itm)
    const isLeaf = Category.isItemLeaf(itm)(category)
    let itemValidation = await Validator.validate(itm, itemValidators(isLeaf, null, siblingsAndSelfByCode))
    const prevItemValidation = Validation.getFieldValidation(itemUuid)(prevItemsValidation)
    // keep previous errors or warnings (e.g. invalid children)
    itemValidation = R.pipe(
      Validation.setErrors(Validation.getErrors(prevItemValidation)),
      Validation.setWarnings(Validation.getWarnings(prevItemValidation))
    )(itemValidation)
    itemsValidationUpdated = Validation.assocFieldValidation(itemUuid, itemValidation)(itemsValidationUpdated)
  }
  await Promises.each(itemsToValidate, _validateItem)
  const categoryValidationUpdated = Validation.assocFieldValidation(keys.items, itemsValidationUpdated)(prevValidation)
  return Validation.cleanup(categoryValidationUpdated)
}

class ItemsCache {
  constructor(items) {
    this.items = items
    this.itemsByParentUuid = {}
    this.itemsByUuid = {}
    items.forEach((item) => {
      this.itemsByUuid[CategoryItem.getUuid(item)] = item
      const parentUuid = CategoryItem.getParentUuid(item)
      let siblingItems = this.itemsByParentUuid[parentUuid]
      if (!siblingItems) {
        siblingItems = []
        this.itemsByParentUuid[parentUuid] = siblingItems
      }
      siblingItems.push(item)
    })
  }

  getItemByUuid(itemUuid) {
    return this.itemsByUuid[itemUuid]
  }

  getParentItem(item) {
    return this.getItemByUuid(CategoryItem.getParentUuid(item))
  }

  getItemChildren(itemUuid) {
    return this.itemsByParentUuid[itemUuid] ?? []
  }

  getFirstLevelItems() {
    return this.getItemChildren(null)
  }

  getSiblingItems(item) {
    return this.getItemChildren(CategoryItem.getParentUuid(item))
  }
}
