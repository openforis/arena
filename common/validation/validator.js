const R = require('ramda')
const Promise = require('bluebird')

const getProp = propName => R.path(propName.split('.'))

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
  const fieldValidationsInvalid = R.reduce(
    (acc, field) => acc[field].valid ? R.dissoc(field, acc) : acc,
    fieldValidations,
    R.keys(fieldValidations)
  )

  return {
    valid: !R.any(
      prop => R.pathEq([prop, 'valid'], false, fieldValidationsInvalid),
      R.keys(fieldValidationsInvalid),
    ),
    fields: fieldValidationsInvalid
  }
}

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    getProp(propName),
    R.defaultTo(''),
  )(obj)

  return R.isEmpty(value)
    ? 'empty'
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
      ? 'duplicate'
      : null
  }

//==== getters

const getValidation = R.propOr({valid: true}, 'validation')

const isValid = R.pipe(getValidation, R.propEq('valid', true))

const getFieldValidation = field => R.pathOr(
  {valid: true, errors: []},
  ['fields', field],
)

//==== update
const assocValidation = validation => R.assoc('validation', validation)

const updateValidationStatus = validation => {
  const invalid = R.any(R.propEq('valid', false))(R.values(validation.fields))
  return R.assoc('valid', !invalid, validation)
}

const updateFieldValidation = (key, fieldValidation) => R.pipe(
  R.assocPath(['fields', key], fieldValidation),
  updateValidationStatus,
)

const dissocFieldValidation = key => R.pipe(
  R.dissocPath(['fields', key]),
  updateValidationStatus,
)

module.exports = {
  validate,
  validateProp,
  validateRequired,
  validateItemPropUniqueness,

  getValidation,
  isValid,
  getFieldValidation,

  assocValidation,
  updateFieldValidation,
  dissocFieldValidation,
  updateValidationStatus,
}