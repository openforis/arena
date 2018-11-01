const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateRequired, validateItemPropUniqueness} = require('../../common/validation/validator')

const {getCodeListLevelsArray, isCodeListItemLeaf} = require('../../common/survey/codeList')

const codeListValidators = (codeLists) => ({
  'props.name': [validateRequired, validateItemPropUniqueness(codeLists)],
})

const levelValidators = (levels) => ({
  'props.name': [validateRequired, validateItemPropUniqueness(levels)],
})

// ====== LEVELS

const validateLevel = async (levels, level) =>
  await validate(level, levelValidators(levels))

const validateLevels = async (codeList) => {
  const levels = getCodeListLevelsArray(codeList)

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
  'props.code': [validateRequired, validateItemPropUniqueness(items)],
})

const validateItem = async (codeList, items, itemId) => {
  const item = R.find(R.propEq('id', itemId))(items)
  const validation = await validate(item, itemValidators(items.filter(i => i.parentId === item.parentId)))

  const isLeaf = isCodeListItemLeaf(item)(codeList)

  if (isLeaf) {
    return {[item.uuid]: validation}
  } else {
    const childValidations = await validateItemsByParentId(codeList, items, item.id)

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

const validateItemsByParentId = async (codeList, items, parentItemId) => {
  const children = R.filter(R.propEq('parentId', parentItemId), items)
  const emptyChildren = R.isEmpty(children)

  const childValidations = await Promise.all(children.map(
    async child => await validateItem(codeList, items, child.id)
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

const validateCodeListProps = async (codeLists, codeList) =>
  await validate(codeList, codeListValidators(codeLists))

const validateCodeList = async (codeLists, codeList, items) => {
  const codeListValidation = await validateCodeListProps(codeLists, codeList)
  const levelsValidation = await validateLevels(codeList)
  const itemsValidation = await validateItemsByParentId(codeList, items, null)

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