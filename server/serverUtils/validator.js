const R = require('ramda')
const Promise = require('bluebird')

const validateProp = async (obj, prop, validations) => {
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
  const fields = R.mergeAll(
    await Promise.all(
      R.keys(propsValidations)
        .map(async prop => ({
          [R.pipe(R.split('.'), R.last)(prop)]: await validateProp(obj, prop, propsValidations[prop])
        }))
    )
  )
  return {
    valid: !R.any(
      prop => R.pathEq([prop, 'valid'], false, fields),
      R.keys(fields),
    ),
    fields
  }
}

const createError = (error) => error
  ? R.pipe(
    R.assoc('valid', false),
    R.assoc('error', error),
  )({})
  : null

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    R.path(propName.split('.')),
    R.defaultTo(''),
  )(obj)

  const error = R.isEmpty(value)
    ? 'empty'
    : null

  return createError(error)
}

const validateRequired2 = (propName, obj) => {
  const value = R.pipe(
    R.path(propName.split('.')),
    R.defaultTo(''),
  )(obj)

  return R.isEmpty(value)
    ? 'empty'
    : null
}

const assocValidation = (name, validation, obj) => R.propEq('valid', false, validation ? validation : {})
  ? R.pipe(
    R.assocPath(['validation', 'valid'], false),
    R.assocPath(['validation', 'fields', name], validation),
  )(obj)
  : obj

module.exports = {
  validate,
  validateProp,

  createError,
  validateRequired,
  validateRequired2,
  assocValidation,
}