const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateRequired} = require('../../common/validation/validator')

const {getCodeListName, getCodeListLevelName, getCodeListLevelsArray, getCodeListItemCode} = require('../../common/survey/codeList')

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
  return R.reduce((acc, validation) => R.assoc(R.keys(acc).length, validation)(acc), {})(validations)
}

// ====== ITEMS

const codeListItemValidators = (items) => ({
  'props.code': [validateRequired, validateCodeListItemCodeUniqueness(items)],
})

const validateCodeListItemCodeUniqueness = items =>
  (propName, item) => {
    const itemsInLevel = R.filter(it => it.levelId === item.levelId)(items)

    const hasDuplicates = R.any(
      l => getCodeListItemCode(l) === getCodeListItemCode(item) && l.id !== item.id,
      itemsInLevel
    )
    return hasDuplicates
      ? 'duplicate'
      : null
  }

const validateCodeListItem = async (items, item) => {
  const validation = await validate(item, codeListItemValidators(items))

  if (validation.valid) {
    const children = R.filter(it => it.parentId === item.id)(items)
    const childrenValidations = await Promise.all(children.map(async child => await validateCodeListItem(items, child)))
    const hasInvalidChildren = R.any(childValidation => !childValidation.valid)(childrenValidations)

    return {
      valid: !hasInvalidChildren,
      errors: hasInvalidChildren ? ['invalid_children'] : []
    }
  } else {
    return validation
  }
}

const validateCodeListItems = async (codeList, items) => {
  const levels = getCodeListLevelsArray(codeList)
  const firstLevel = R.head(levels)

  const firstLevelItems = R.filter(item => item.levelId === firstLevel.id)(items)

  const itemsValidations = await Promise.all(firstLevelItems.map(async item => await validateCodeListItem(items, item)))

  return {
    valid: R.pipe(
      R.any(validation => !validation.valid),
      R.not,
    )(itemsValidations)
  }
}

const validateCodeList = async (codeLists, codeList, items) => {
  const codeListValidation = await validate(codeList, codeListValidators(codeLists))
  const {valid: codeListValid, ...codeListPartialValidation} = codeListValidation
  const levelsValidation = await validateCodeListLevels(codeList)
  const levelsValid = !R.any(validation => !validation.valid)(R.values(levelsValidation))

  const itemsValidation = await validateCodeListItems(codeList, items)

  return {
    valid: codeListValid && levelsValid && itemsValidation.valid,
    ...codeListPartialValidation,
    levels: levelsValidation,
    items: itemsValidation,
  }
}

module.exports = {
  validateCodeList,
  validateCodeListLevel,
  validateCodeListItem,
}