const R = require('ramda')

const getRestParam = (req, param, defaultValue = null) => {
  const queryValue = R.path(['query', param], req)
  const paramsValue = R.path(['params', param], req)
  const bodyValue = R.path(['body', param], req)

  return queryValue || paramsValue || bodyValue || defaultValue
}

const getBoolParam = R.pipe(
  getRestParam,
  R.equals('true'),
)

const toQueryString = obj =>
  R.reduce((acc, key) => {
    const value = R.prop(key)(obj)
    return value ? `${acc}&${key}=${value}` : acc
  }, '')(R.keys(obj))

module.exports = {
  getRestParam,
  getBoolParam,
  toQueryString,
}