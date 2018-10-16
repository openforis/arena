const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateRequired} = require('../../common/validation/validator')

const {
  getCodeListName,
  getCodeListLevelName,
  getCodeListLevelsArray,
  getCodeListItemCode,
  getCodeListItemLevelId,
  getCodeListLevelById,
} = require('../../common/survey/codeList')

const codeListValidators = (codeLists) => ({
  'props.name': [validateRequired, validateCodeListNameUniqueness(codeLists)],
})

const validateCodeListNameUniqueness = codeLists =>
  (propName, codeList) => {

    const hasDuplicates = R.any(
      l => getCodeListName(l) === getCodeListName(codeList) && l.id !== codeList.id,
      codeLists
    )
    return hasDuplicates
      ? 'duplicate'
      : null
  }

const codeListLevelValidators = (levels) => ({
  'props.name': [validateRequired, validateCodeListLevelNameUniqueness(levels)],
})

const validateCodeListLevelNameUniqueness = levels =>
  (propName, level) => {
    const hasDuplicates = R.any(
      l => getCodeListLevelName(l) === getCodeListLevelName(level) && l.id !== level.id,
      levels
    )
    return hasDuplicates
      ? 'duplicate'
      : null
  }

// ====== LEVELS

const validateCodeListLevel = async (levels, level) =>
  await validate(level, codeListLevelValidators(levels))

const validateCodeListLevels = async (codeList) => {
  const levels = getCodeListLevelsArray(codeList)

  const validations = await Promise.all(
    levels.map(
      async level => await validateCodeListLevel(levels, level)
    )
  )

  const invalid = R.any(R.propEq('valid', false))(validations)
  return {
    valid: !invalid,
    fields: Object.assign({}, validations)
  }

}

// ====== ITEMS

const codeListItemValidators = (items) => ({
  'props.code': [validateRequired, validateCodeListItemCodeUniqueness(items)],
})

const validateCodeListItemCodeUniqueness = items =>
  (propName, item) => {
    const siblingItems = R.filter(it => it.parentId === item.parentId)(items)

    const hasDuplicates = R.any(
      l => getCodeListItemCode(l) === getCodeListItemCode(item) && l.id !== item.id,
      siblingItems
    )
    return hasDuplicates
      ? 'duplicate'
      : null
  }

const validateCodeListItem = async (codeList, items, itemId) => {
  const item = R.find(R.propEq('id', itemId))(items)

  const validation = await validate(item, codeListItemValidators(items))

  const level = getCodeListLevelById(getCodeListItemLevelId(item))(codeList)
  const isLeaf = getCodeListLevelsArray(codeList).length === level.index + 1

  if (isLeaf) {
    return validation
  } else {
    const childValidation = await validateCodeListItems(codeList, items, item.id)

    return R.pipe(
      R.assoc('valid', validation.valid && childValidation.valid),
      R.assocPath(['fields', 'items'], childValidation),
    )(validation)
  }
}

const validateCodeListItems = async (codeList, items, parentItemId) => {

  const itemsToValidate = R.filter(R.propEq('parentId', parentItemId))(items)

  const itemsValidation = await Promise.all(
    itemsToValidate.map(async item => {
        const validation = await validateCodeListItem(codeList, items, item.id)
        return validation.valid
          ? null
          : {[item.uuid]: validation}
      }
    )
  )
  return R.pipe(
    R.reject(R.isNil),
    R.mergeAll,
    validations => R.pipe(
      R.assoc('valid', !R.isEmpty(itemsToValidate) && R.isEmpty(validations)),
      R.assoc('fields', validations),
      R.assoc('errors', R.isEmpty(itemsToValidate) ? ['empty'] : [])
    )({})
  )(itemsValidation)
}

const validateCodeListProps = async (codeLists, codeList) =>
  await validate(codeList, codeListValidators(codeLists))

const validateCodeList = async (codeLists, codeList, items) => {
  const codeListValidation = await validateCodeListProps(codeLists, codeList)
  const levelsValidation = await validateCodeListLevels(codeList)
  const itemsValidation = await validateCodeListItems(codeList, items, null)

  const valid = codeListValidation.valid && levelsValidation.valid && itemsValidation.valid

  return R.pipe(
    R.assoc('valid', valid),
    R.assocPath(['fields', 'levels'], levelsValidation),
    R.assocPath(['fields', 'items'], itemsValidation),
  )(codeListValidation)

}

module.exports = {
  validateCodeList,
  validateCodeListProps,
  validateCodeListLevels,
  validateCodeListItems,
}