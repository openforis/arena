const R = require('ramda')
const Promise = require('bluebird')

const {
  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword
} = require('../../common/validation/validator')

const CodeList = require('../../common/survey/codeList')

// ====== LEVELS

const levelValidators = (levels) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(levels)],
})

const validateLevel = async (levels, level) =>
  await validate(level, levelValidators(levels))

const validateLevels = async (codeList) => {
  const levels = CodeList.getCodeListLevelsArray(codeList)

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

const validateItem = async (codeList, items, itemUuid) => {
  const item = R.find(R.propEq('uuid', itemUuid))(items)
  const validation = await validate(item, itemValidators(getChildrenItems(items, item.parentUuid)))

  const isLeaf = CodeList.isCodeListItemLeaf(item)(codeList)

  if (isLeaf) {
    return {[item.uuid]: validation}
  } else {
    const childValidations = await validateItemsByParentUUID(codeList, items, item.uuid)

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

const validateItemsByParentUUID = async (codeList, items, parentItemUuid) => {
  const children = getChildrenItems(items, parentItemUuid)
  const emptyChildren = R.isEmpty(children)

  const childValidations = await Promise.all(children.map(
    async child => await validateItem(codeList, items, child.uuid)
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

// ====== CODE LIST

const codeListValidators = (codeLists) => ({
  'props.name': [validateRequired, validateNotKeyword, validateItemPropUniqueness(codeLists)],
})

const validateCodeListProps = async (codeLists, codeList) =>
  await validate(codeList, codeListValidators(codeLists))

const validateCodeList = async (codeLists, codeList, items) => {
  const codeListValidation = await validateCodeListProps(codeLists, codeList)
  const levelsValidation = await validateLevels(codeList)
  const itemsValidation = await validateItemsByParentUUID(codeList, items, null)

  const valid = codeListValidation.valid && levelsValidation.valid && itemsValidation.valid

  return R.pipe(
    R.assoc('valid', valid),
    R.assocPath(['fields', 'levels'], levelsValidation),
    R.assocPath(['fields', 'items'], itemsValidation),
  )(codeListValidation)

}

module.exports = {
  validateCodeList,
}