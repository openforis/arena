const R = require('ramda')

const SystemError = require('../../server/utils/systemError')

const getServerUrl = req => `${req.protocol}://${req.get('host')}`

const getParams = req => R.pipe(
  R.mergeLeft(R.prop('query', req)),
  R.mergeLeft(R.prop('params', req)),
  R.mergeLeft(R.prop('body', req)),
  // convert String boolean values to Boolean type
  R.mapObjIndexed(val =>
    R.ifElse(
      v => v === 'true' || v === 'false',
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

const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = getRestParam(req, param, null)
  return jsonStr
    ? JSON.parse(jsonStr)
    : defaultValue
}

const getRequiredParam = (req, param) => {
  const value = getRestParam(req, param, '')
  if (R.isEmpty(value))
    throw new SystemError('paramIsRequired', { param })
  else
    return value
}

const getFile = R.pathOr(null, ['files', 'file'])

const getBody = R.propOr(null, 'body')

// User

const getUser = R.prop('user')
const getUserUuid = R.pipe(getUser, R.prop('uuid'))

// i18n

const getI18n = R.prop('i18n')

module.exports = {
  getServerUrl,
  getParams,
  getJsonParam,
  getRequiredParam,
  getFile,
  getBody,

  // User
  getUserUuid,
  getUser,

  // i18n
  getI18n,
}