const R = require('ramda')

const User = require('../../common/user/user')

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

const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = R.prop(param, getParams(req))
  return jsonStr
    ? JSON.parse(jsonStr)
    : defaultValue
}

const getFile = R.pathOr(null, ['files', 'file'])

const getBody = R.propOr(null, 'body')

// User

const getUser = R.prop('user')
const getUserUuid = R.pipe(getUser, R.prop('uuid'))
const getSurveyCycleKey = R.pipe(getUser, User.getPrefSurveyCurrentCycle)

// i18n

const getI18n = R.prop('i18n')

// Cookies

const getCookie = name => R.path(['cookies', name])

const getSocketId = getCookie('io')

module.exports = {
  getServerUrl,
  getParams,
  getJsonParam,
  getFile,
  getBody,

  // User
  getUserUuid,
  getUser,
  getSurveyCycleKey,

  // i18n
  getI18n,

  // Cookies
  getSocketId
}