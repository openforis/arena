const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateProp, validateRequired} = require('../../common/validation/validator')

const {fetchCodeListsBySurveyId} = require('./codeListRepository')
const {getCodeListName, getCodeListLevelName, getCodeListLevelsArray} = require('../../common/survey/codeList')

const codeListValidators = (codeLists) => ({
  'props.name': [validateRequired, validateCodeListNameUniqueness(codeLists)],
  'levels': [validateCodeListLevels]
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
    // console.log("validating level name uniqueness", JSON.stringify(level), hasDuplicates)

    return hasDuplicates
      ? 'duplicate'
      : null
  }

const validateCodeListLevel = async (levels, level) =>
  await validate(level, codeListLevelValidators(levels))

const validateCodeListLevels = async (propName, codeList) => {
  const levels = getCodeListLevelsArray(codeList)
  const validations = await Promise.all(
    levels.map(
      async level => await validateCodeListLevel(levels, level)
    )
  )

  return null
}

const validateCodeList = async (codeLists, codeList) =>
  await validate(codeList, codeListValidators(codeLists))

module.exports = {
  validateCodeList
}