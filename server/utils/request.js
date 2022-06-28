import * as R from 'ramda'

import * as User from '@core/user/user'

export const getServerUrl = (req) => `${req.protocol}://${req.get('host')}`

export const getHost = (req) => req.header('host')

export const getUrl = R.prop('url')

export const getParams = (req) =>
  R.pipe(
    R.mergeLeft(R.prop('query', req)),
    R.mergeLeft(R.prop('params', req)),
    R.mergeLeft(R.prop('body', req)),
    // Convert String boolean values to Boolean type
    R.mapObjIndexed((val) => R.ifElse((v) => v === 'true' || v === 'false', R.always(val === 'true'), R.identity)(val))
  )({})

export const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = R.prop(param, getParams(req))
  if (jsonStr && typeof jsonStr === 'string') return JSON.parse(jsonStr)
  if (jsonStr && typeof jsonStr === 'object') return jsonStr // already parsed to a JSON object
  return defaultValue
}

export const getFile = (req) => req?.files || req?.file || null
export const getFiles = (req) => req?.files || req?.file || null
export const getFilePath = (req) => getFile(req)?.tempFilePath || null

export const getBody = R.propOr(null, 'body')

// User

export const getUser = R.prop('user')
export const getUserUuid = R.pipe(getUser, R.prop('uuid'))
export const getSurveyCycleKey = R.pipe(getUser, User.getPrefSurveyCurrentCycle)

// Headers

const getHeader = (name) => R.path(['headers', name])

export const getSocketId = getHeader('socketid')

// HTTPS

export const isHttps = (req) => req.secure || req.header('x-forwarded-proto') === 'https'
