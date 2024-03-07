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

const validateNotEmptyFirstLevelItems =
  ({ itemsCache }) =>
  (_propName, level) =>
    CategoryLevel.getIndex(level) === 0 && R.isEmpty(itemsCache?.getFirstLevelItems())
      ? { key: Validation.messageKeys.categoryEdit.itemsEmpty }
      : null

const levelValidators = ({ levels, itemsCache, bigCategory }) => ({
  [`${CategoryLevel.keys.props}.${CategoryLevel.keysProps.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateItemPropUniqueness(Validation.messageKeys.categoryEdit.levelDuplicate)(levels),
  ],
  ...(!bigCategory ? { [keys.items]: [validateNotEmptyFirstLevelItems({ itemsCache, bigCategory })] } : {}),
})

const validateLevel =
  ({ levels, itemsCache, bigCategory }) =>
  async (level) =>
    Validator.validate(level, levelValidators({ levels, itemsCache, bigCategory }))

const validateLevels = async ({ category, itemsCache, bigCategory }) => {
  const levels = Category.getLevelsArray(category)

  const validations = await Promise.all(levels.map(validateLevel({ levels, itemsCache, bigCategory })))

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

const validateNotEmptyChildrenItems =
  ({ isLeaf, childrenCount }) =>
  () =>
    !isLeaf && childrenCount === 0
      ? { key: Validation.messageKeys.categoryEdit.childrenEmpty, severity: ValidationResult.severity.warning }
      : null

const itemValidators = ({ isLeaf, siblingsAndSelfByCode, childrenCount = 0 }) => ({
  [`${CategoryItem.keys.props}.${CategoryItem.keysProps.code}`]: [
    Validator.validateRequired(Validation.messageKeys.categoryEdit.codeRequired),
    Validator.validateNotKeyword(Validation.messageKeys.categoryEdit.codeCannotBeKeyword),
    validateItemCodeUniqueness(siblingsAndSelfByCode),
  ],
  [keys.children]: [validateNotEmptyChildrenItems({ isLeaf, childrenCount })],
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
      const extraDef = extraDefs[key]
      if (!extraDef || StringUtils.isBlank(extra[key])) {
        return null
      }
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
  return Validation.newInstance(!errorFound, { ...itemsValidationsByUuid }, errors, warnings)
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
    const childrenCount = itemChildren.length
    const visited = !!visitedUuids[itemUuid]

    let validation = null

    if (visited || childrenCount === 0) {
      // Validate leaf items or items without children or items already visited (all descendants have been already visited)
      /* eslint-disable no-await-in-loop */
      validation = await Validator.validate(
        item,
        itemValidators({ isLeaf, siblingsAndSelfByCode, childrenCount }),
        false
      )
      validation = _validateItemExtraProps({ extraDefs, validation, srsIndex })(item)

      // It won't be visited again, remove it from stack
      popItem(item)
    }

    if (childrenCount > 0) {
      if (visited) {
        // All descendants have been validated, add children validation to the item validation
        validation = _addChildrenValidation({ itemsValidationsByUuid, itemChildren, validation })
      } else {
        // Keep the item in the stack, postpone item validation, validate descendant items first
        pushItems(itemChildren)
      }
    }
    itemsValidationsByUuid[itemUuid] = validation
    errorFound = errorFound || !Validation.isValid(validation) || Validation.isError(validation)

    visitedUuids[itemUuid] = true
  }
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
  bigCategory = false,
  validateLevels: _validateLevels = true,
  validateItems: _validateItems = true,
  onProgress = null,
  stopIfFn = null,
}) => {
  const itemsCache = !bigCategory && items && (_validateLevels || _validateItems) ? new ItemsCache(items) : null
  const categoryValidation = await validateCategoryProps(categories, category)
  const prevValidation = Category.getValidation(category)

  const levelsValidation = _validateLevels
    ? await validateLevels({ category, itemsCache, bigCategory })
    : Validation.getFieldValidation(keys.levels)(prevValidation)

  const prevItemsValidation = Validation.getFieldValidation(keys.items)(prevValidation)
  let nextItemsValidation = null
  if (_validateItems && itemsCache) {
    nextItemsValidation = await validateAllItems({ survey, category, itemsCache, onProgress, stopIfFn })
  } else if (bigCategory) {
    // cannot calculate items validation (too many items): consider them as always valid
    nextItemsValidation = Validation.newInstance()
  }
  const itemsValidation = nextItemsValidation ?? prevItemsValidation

  return R.pipe(
    Validation.setValid(R.all(Validation.isValid, [categoryValidation, levelsValidation, itemsValidation])),
    Validation.setField(keys.levels, levelsValidation),
    Validation.setField(keys.items, itemsValidation),
    Validation.cleanup
  )(categoryValidation)
}

export const validateItems = async ({ category, itemsToValidate, itemsCountByItemUuid }) => {
  const prevValidation = Category.getValidation(category)
  const siblingsAndSelfByCode = ObjectUtils.groupByProp(CategoryItem.getCode)(itemsToValidate)
  const prevItemsValidation = Validation.getFieldValidation(keys.items)(prevValidation)
  let itemsValidationUpdated = prevItemsValidation

  const _validateItem = async (item) => {
    const itemUuid = CategoryItem.getUuid(item)
    const isLeaf = Category.isItemLeaf(item)(category)
    const childrenCount = itemsCountByItemUuid[itemUuid] ?? 0

    const itemValidation = await Validator.validate(
      item,
      itemValidators({ isLeaf, siblingsAndSelfByCode, childrenCount })
    )
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
