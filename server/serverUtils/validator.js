const R = require('ramda')

const createError = (error) => error
  ? R.pipe(
    R.assoc('valid', false),
    R.assoc('error', error),
  )({})
  : null

const validateRequired = (propName, obj) => {
  const value = R.pipe(
    R.prop(propName),
    R.defaultTo(''),
    R.trim,
  )(obj)

  const error = R.isEmpty(value)
    ? 'empty'
    : null

  return createError(error)
}

module.exports = {
  createError,
  validateRequired,
}