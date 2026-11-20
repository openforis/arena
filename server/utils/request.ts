import type { Request as ExpressRequest } from 'express'

import * as A from '@core/arena'

import * as ProcessUtils from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import * as User from '@core/user/user'

export const getServerUrl = (req: ExpressRequest) => `${req.protocol}://${req.get('host')}`

/**
 * Removes trailing slash characters from a URL origin.
 * @param {string} value - URL or origin that may end with slashes.
 * @returns {string} Value without trailing slashes.
 */
const stripTrailingSlashes = (value: string): string => {
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
export const getPublicServerUrl = (req: ExpressRequest) => {
  const configured = ProcessUtils.ENV.arenaPublicUrl
  if (configured) {
    return stripTrailingSlashes(String(configured))
  }
  return getServerUrl(req)
}

export const getHost = (req: ExpressRequest) => req.header('host')

export const getUrl = A.prop('url')

// query, path and body params (body first), with 'true' / 'false' strings converted to booleans
export const getParams = (req: ExpressRequest): Record<string, any> =>
  A.pipe(
    A.mergeLeft(A.prop('query', req)),
    A.mergeLeft(A.prop('params', req)),
    A.mergeLeft(A.prop('body', req)),
    // Convert String boolean values to Boolean type
    A.mapObjIndexed((val) => A.ifElse((v) => v === 'true' || v === 'false', A.always(val === 'true'), A.identity)(val))
  )({})

export const getJsonParam = (req: ExpressRequest, param, defaultValue = null) => {
  const jsonStr = A.prop(param, getParams(req))
  if (jsonStr && typeof jsonStr === 'string') return JSON.parse(jsonStr)
  if (jsonStr && typeof jsonStr === 'object') return jsonStr // already parsed to a JSON object
  return defaultValue
}

export const getNumericParam = (req: ExpressRequest, param, defaultValue = null) => {
  const value = A.prop(param, getParams(req))
  if (value === undefined) return defaultValue
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? defaultValue : numericValue
}

export const getRequiredParam = (req: ExpressRequest, param) => {
  const value = A.prop(param, getParams(req))
  if (!value) {
    throw new Error(`${param} is required`)
  }
  return value
}

export const getRequiredIntegerParam = (req: ExpressRequest, param) => {
  const value = getRequiredParam(req, param)
  if (!Number.isInteger(Number(value))) {
    throw new TypeError(`${param} must be a valid integer`)
  }
  return value
}

const integerStringRegex = /^-?\d+$/

/**
 * Returns the value of an optional integer param.
 * @param {object} req - The HTTP request.
 * @param {string} param - The param name.
 * @returns {number|null} The param value as an integer, or null when the param is not specified.
 * @throws {SystemError} With status 400 when the param is specified but it is not an integer.
 */
export const getIntegerParam = (req: ExpressRequest, param) => {
  const value = A.prop(param, getParams(req))
  if (value === undefined || value === null || value === '') return null
  // strict string check: Number() would also accept values like '1e3', '0x10' or ' 1 '
  const integerValue = typeof value === 'string' && integerStringRegex.test(value) ? Number(value) : value
  if (!Number.isSafeInteger(integerValue)) {
    throw new SystemError('appErrors:paramMustBeInteger', { param }, StatusCodes.BAD_REQUEST)
  }
  return integerValue
}

/**
 * Returns the "key" param of a prop update request, failing when that prop cannot be updated through the request.
 * @param {object} req - The request.
 * @param {string[]} updatablePropKeys - The keys of the props that can be updated.
 * @returns {string} - The prop key.
 */
export const getUpdatablePropKey = (req: ExpressRequest, updatablePropKeys) => {
  const key = A.prop('key', getParams(req))
  if (!updatablePropKeys.includes(key)) {
    throw new SystemError('propUpdateNotAllowed', { key }, StatusCodes.BAD_REQUEST)
  }
  return key
}

export const getFile = A.pathOr(null, ['files', 'file'])
// files uploaded with express-fileupload (files) or multer (file)
export const getFiles = (req: ExpressRequest & { files?: unknown; file?: unknown }) => req?.files || req?.file || null
export const getFilePath = (req: ExpressRequest) => getFile(req)?.tempFilePath || null

export const getBody = A.propOr(null, 'body')

// User

export const getUser = A.prop('user')
export const getUserUuid = A.pipe(getUser, A.prop('uuid'))
export const getSurveyCycleKey = A.pipe(getUser, User.getPrefSurveyCurrentCycle)

// Headers

const getHeader = (name: string) => A.path(['headers', name])

export const getSocketId = getHeader('socketid')

// HTTPS

export const isHttps = (req: ExpressRequest) => req.secure || req.header('x-forwarded-proto') === 'https'

// Download file name set by download auth middleware
export const getDownloadFileName = A.prop('downloadFileName')
