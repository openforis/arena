const R = require('ramda')
const Promise = require('bluebird')

const keywords = [
  'date_created',
  'date_modified',
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
  empty: 'empty',
  exceedingMax: 'exceedingMax',
  keyword: 'keyword',
  invalidNumber: 'invalidNumber',
  zeroOrNegative: 'zeroOrNegative',
}

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors'
}

const validValidation = {
  [keys.valid]: true,
  [keys.errors]: []
}

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

const validate = async (obj, propsValidations) => {
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
  return cleanup({[keys.fields]: fieldValidations})
}

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    getProp(propName),
    R.defaultTo(''),
  )(obj)

  return R.isEmpty(value)
    ? errorKeys.empty
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
      ? errorKeys.duplicate
      : null
  }

const validateNotKeyword = (propName, item) =>
  R.contains(getProp(propName)(item), keywords)
    ? errorKeys.keyword
    : null

const validateNumber = (propName, item) => {
  const value = getProp(propName)(item)
  return value && isNaN(value) ? errorKeys.invalidNumber : null
}

const validatePositiveNumber = (propName, item) => {
  const invalidNumberError = validateNumber(propName, item)
  if (invalidNumberError) {
    return invalidNumberError
  } else {
    const value = getProp(propName)(item)
    return !value || value > 0 ? null : errorKeys.zeroOrNegative
  }
}

//==== getters

const getValidation = R.propOr(validValidation, 'validation')

const isValid = R.pipe(getValidation, R.propEq(keys.valid, true))

const getFieldValidations = R.propOr({}, keys.fields)

const getFieldValidation = field => R.pathOr(validValidation, [keys.fields, field])

const getInvalidFieldValidations = R.pipe(
  R.prop(keys.fields),
  R.reject(R.propEq(keys.valid, true))
)

//==== update
/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = R.pipe(
  getFieldValidations,
  R.reject(R.propEq(keys.valid, true)),
  invalidFieldValidations => ({
    [keys.fields]: invalidFieldValidations,
    [keys.valid]: R.isEmpty(invalidFieldValidations)
  }),
)

module.exports = {
  errorKeys,

  validate,
  validateProp,
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword,
  validatePositiveNumber,

  getValidation,
  isValid,
  getFieldValidation,
  getFieldValidations,
  getInvalidFieldValidations,

  cleanup
}