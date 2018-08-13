const R = require('ramda')

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
  createError,
  validateRequired,
  validateRequired2,
  assocValidation,
}