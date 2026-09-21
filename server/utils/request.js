import * as A from '@core/arena'

import * as ProcessUtils from '@core/processUtils'
import * as User from '@core/user/user'

export const getServerUrl = (req) => `${req.protocol}://${req.get('host')}`

/**
 * Removes trailing slash characters from a URL origin.
 * @param {string} value - URL or origin that may end with slashes.
 * @returns {string} Value without trailing slashes.
 */
const stripTrailingSlashes = (value) => {
  let end = value.length
  while (end > 0 && value.charAt(end - 1) === '/') {
    end -= 1
  }
  return value.slice(0, end)
}

/**
 * Returns the public origin for URLs that outlive the request (QR codes, emails).
 * Prefers ARENA_PUBLIC_URL when configured; otherwise uses the request Host.
 * @param {object} req - Express request.
 * @returns {string} Origin without a trailing slash.
 */
export const getPublicServerUrl = (req) => {
  const configured = ProcessUtils.ENV.arenaPublicUrl
  if (configured) {
    return stripTrailingSlashes(String(configured))
  }
  return getServerUrl(req)
}

export const getHost = (req) => req.header('host')

export const getUrl = A.prop('url')

export const getParams = (req) =>
  A.pipe(
    A.mergeLeft(A.prop('query', req)),
    A.mergeLeft(A.prop('params', req)),
    A.mergeLeft(A.prop('body', req)),
    // Convert String boolean values to Boolean type
    A.mapObjIndexed((val) => A.ifElse((v) => v === 'true' || v === 'false', A.always(val === 'true'), A.identity)(val))
  )({})

export const getJsonParam = (req, param, defaultValue = null) => {
  const jsonStr = A.prop(param, getParams(req))
  if (jsonStr && typeof jsonStr === 'string') return JSON.parse(jsonStr)
  if (jsonStr && typeof jsonStr === 'object') return jsonStr // already parsed to a JSON object
  return defaultValue
}

export const getNumericParam = (req, param, defaultValue = null) => {
  const value = A.prop(param, getParams(req))
  if (value === undefined) return defaultValue
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? defaultValue : numericValue
}

export const getRequiredParam = (req, param) => {
  const value = A.prop(param, getParams(req))
  if (!value) {
    throw new Error(`${param} is required`)
  }
  return value
}

export const getRequiredIntegerParam = (req, param) => {
  const value = getRequiredParam(req, param)
  if (!Number.isInteger(Number(value))) {
    throw new TypeError(`${param} must be a valid integer`)
  }
  return value
}

export const getFile = A.pathOr(null, ['files', 'file'])
export const getFiles = (req) => req?.files || req?.file || null
export const getFilePath = (req) => getFile(req)?.tempFilePath || null

export const getBody = A.propOr(null, 'body')

// User

export const getUser = A.prop('user')
export const getUserUuid = A.pipe(getUser, A.prop('uuid'))
export const getSurveyCycleKey = A.pipe(getUser, User.getPrefSurveyCurrentCycle)

// Headers

const getHeader = (name) => A.path(['headers', name])

export const getSocketId = getHeader('socketid')

// HTTPS

export const isHttps = (req) => req.secure || req.header('x-forwarded-proto') === 'https'

// Download file name set by download auth middleware
export const getDownloadFileName = A.prop('downloadFileName')
