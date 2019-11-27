import * as R from 'ramda'

import * as User from '@core/user/user'

export const getServerUrl = req => `${req.protocol}://${req.get('host')}`

export const getParams = req => R.pipe(
  R.mergeLeft(R.prop('query', req)),
  R.mergeLeft(R.prop('params', req)),
  R.mergeLeft(R.prop('body', req)),
  // Convert String boolean values to Boolean type
  R.mapObjIndexed(val =>
    R.ifElse(
      v => v === 'true' || v === 'false',
      R.always(val === 'true'),
      R.identity
    )(val)
  )
)({})

export const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = R.prop(param, getParams(req))
  return jsonStr
    ? JSON.parse(jsonStr)
    : defaultValue
}

export const getFile = R.pathOr(null, ['files', 'file'])

export const getBody = R.propOr(null, 'body')

// User

export const getUser = R.prop('user')
export const getUserUuid = R.pipe(getUser, R.prop('uuid'))
export const getSurveyCycleKey = R.pipe(getUser, User.getPrefSurveyCurrentCycle)

// I18n

export const getI18n = R.prop('i18n')

// Cookies

const getCookie = name => R.path(['cookies', name])

export const getSocketId = getCookie('io')
