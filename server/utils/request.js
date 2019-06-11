const R = require('ramda')

const SystemError = require('../../server/utils/systemError')

const getParams = req => R.pipe(
  R.mergeLeft(R.prop('query', req)),
  R.mergeLeft(R.prop('params', req)),
  R.mergeLeft(R.prop('body', req)),
  // convert String boolean values to Boolean type
  R.mapObjIndexed(val =>
    R.ifElse(
      R.or(
        R.equals('true'),
        R.equals('false')
      ),
      R.always(val === 'true'),
      R.identity
    )(val)
  )
)({})

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

const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = getRestParam(req, param, null)
  return jsonStr
    ? JSON.parse(jsonStr)
    : defaultValue
}

const toQueryString = obj =>
  R.reduce((acc, key) => {
    const value = R.prop(key)(obj)
    if (value || value === false) {
      const reqVal = R.is(Object, value)
        ? JSON.stringify(value)
        : value
      return `${acc}&${key}=${reqVal}`
    } else {
      return acc
    }
  }, '')(R.keys(obj))

const getRequiredParam = (req, param) => {
  const value = getRestParam(req, param, '')
  if (R.isEmpty(value))
    throw new SystemError({ key: 'paramIsRequired', params: { param } })
  else
    return value
}

const getFile = R.pathOr(null, ['files', 'file'])

// passport session

const getSessionUserId = R.path(['session', 'passport', 'user'])
const getSessionUser = R.prop('user')

module.exports = {
  getParams,
  getRestParam,
  getBoolParam,
  getJsonParam,
  toQueryString,
  getRequiredParam,
  getFile,

  //session
  getSessionUserId,
  getSessionUser,
}