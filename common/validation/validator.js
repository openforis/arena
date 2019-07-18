const R = require('ramda')

const keywords = [
  'asc',
  'date_created',
  'date_modified',
  'desc',
  'file',
  'id',
  'node_def_uuid',
  'owner_id',
  'parent_id',
  'parent_uuid',
  'props',
  'props_draft',
  'props_advanced',
  'record_uuid',
  'step',
  'uuid',
  'value',
]

const errorKeys = {
  duplicate: 'duplicate',
  duplicateCode: 'duplicateCode',
  duplicateName: 'duplicateName',
  empty: 'empty',
  exceedingMax: 'exceedingMax',
  keyword: 'keyword',
  invalidNumber: 'invalidNumber',
  zeroOrNegative: 'zeroOrNegative',
  invalidName: 'invalidName'
}

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
  validation: 'validation'
}

const validValidation = {
  [keys.valid]: true
}

/**
 * Internal names must contain only lowercase letters, numbers and underscores,
 * starting with a letter
 */
const validNameRegex = /^[a-z][a-z0-9_]*$/

const getProp = (propName, defaultValue) => R.pathOr(defaultValue, propName.split('.'))

const validateProp = async (obj, prop, validations = []) => {
  const errors = R.reject(
    R.isNil,
    await Promise.all(
      validations.map(validationFn => validationFn(prop, obj))
    )
  )
  return {
    valid: R.isEmpty(errors),
    errors,
  }
}

const validate = async (obj, propsValidations, performCleanup = true) => {
  const fieldValidations = R.mergeAll(
    await Promise.all(
      R.keys(propsValidations)
        .map(
          async (prop) => ({
            [R.pipe(R.split('.'), R.last)(prop)]: await validateProp(obj, prop, propsValidations[prop])
          })
        )
    )
  )
  const validation = {
    [keys.fields]: fieldValidations,
    [keys.valid]: R.pipe(
      R.values,
      R.all(isValidationValid)
    )(fieldValidations)
  }

  return performCleanup
    ? cleanup(validation)
    : validation
}

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    getProp(propName),
    R.defaultTo(''),
  )(obj)

  return R.isEmpty(value)
    ? { key: errorKeys.empty }
    : null
}

const validateItemPropUniqueness = items =>
  (propName, item) => {

    const hasDuplicates = R.any(
      i => getProp(propName)(i) === getProp(propName)(item) &&
        (
          R.prop('id')(i) !== R.prop('id')(item) ||
          R.prop('uuid')(i) !== R.prop('uuid')(item)
        )
      , items)

    return hasDuplicates
      ? { key: errorKeys.duplicate }
      : null
  }

const validateNotKeyword = (propName, item) =>
  R.contains(getProp(propName)(item), keywords)
    ? { key: errorKeys.keyword }
    : null

const validateName = (propName, item) => {
  const prop = getProp(propName)(item)
  return !prop || validNameRegex.test(prop)
    ? null
    : { key: errorKeys.invalidName }
}

const validateNumber = (propName, item) => {
  const value = getProp(propName)(item)
  return value && isNaN(value) ? { key: errorKeys.invalidNumber } : null
}

const validatePositiveNumber = (propName, item) => {
  const invalidNumberError = validateNumber(propName, item)
  if (invalidNumberError) {
    return invalidNumberError
  } else {
    const value = getProp(propName)(item)
    return !value || value > 0 ? null : { key: errorKeys.zeroOrNegative }
  }
}

//==== getters
const getValidation = R.propOr(validValidation, keys.validation)

//TODO rename to isValid
const isValidationValid = R.propOr(true, keys.valid)

//TODO rename to isObjValid
const isValid = R.pipe(getValidation, isValidationValid)

const getFieldValidations = R.propOr({}, keys.fields)

const getFieldValidation = field => R.pathOr(validValidation, [keys.fields, field])

const getInvalidFieldValidations = R.pipe(
  getFieldValidations,
  R.reject(R.propEq(keys.valid, true))
)

const getErrors = R.propOr([], keys.errors)

//==== update
/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = validation => R.pipe(
  getFieldValidations,
  // cleanup field validations
  R.map(cleanup),
  R.reject(isValidationValid),
  R.ifElse(
    R.isEmpty,
    () => validValidation,
    invalidFieldValidations => ({
      [keys.fields]: invalidFieldValidations,
      [keys.valid]: false
    }),
  ),
  // cleanup errors
  newValidation => {
    const errors = getErrors(validation)
    return R.isEmpty(errors)
      ? newValidation
      : {
        ...newValidation,
        [keys.errors]: errors,
        [keys.valid]: false
      }
  }
)(validation)

const assocValidation = v => R.assoc(keys.validation, v)

const assocFieldValidation = (field, fieldValidation) => R.pipe(
  R.assocPath([keys.fields, field], fieldValidation),
  cleanup
)

const dissocFieldValidation = field => R.pipe(
  R.dissocPath([keys.fields, field]),
  cleanup
)

const mergeValidation = validationNew =>
  validationOld => R.pipe(
    validation => ({
      [keys.fields]: {
        ...getFieldValidations(validation),
        ...getFieldValidations(validationNew),
      }
    }),
    cleanup,
  )(validationOld)

const recalculateValidity = validation =>
  R.pipe(
    getFieldValidations,
    // update validity in each field
    R.map(recalculateValidity),
    newFields => {
      const errors = getErrors(validation)
      return R.pipe(
        R.assoc(keys.valid, R.all(isValidationValid, R.values(newFields)) && R.isEmpty(errors)),
        R.assoc(keys.fields, newFields)
      )(validation)
    }
  )(validation)

module.exports = {
  keys,
  errorKeys,
  keywords,

  validValidation,

  validate,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword,
  validateName,
  validatePositiveNumber,

  // READ
  getValidation,
  isValidationValid,
  isValid,
  getFieldValidation,
  getFieldValidations,
  getInvalidFieldValidations,
  getErrors,

  // UPDATE
  cleanup,
  assocValidation,
  assocFieldValidation,
  dissocFieldValidation,
  mergeValidation,
  recalculateValidity
}