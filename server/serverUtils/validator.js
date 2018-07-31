const R = require('ramda')

const createError = (error) => error
  ? R.pipe(
    R.assoc('valid', false),
    R.assoc('error', error),
  )({})
  : null

const validateRequired = async (obj, name) => {
  const value = R.prop(name, obj)
  const error = R.isEmpty(value) || R.isNil(value)
    ? 'empty'
    : null

  return createError(error)
}

module.exports = {
  createError,
  validateRequired,
}