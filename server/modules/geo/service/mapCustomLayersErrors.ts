import SystemError, { StatusCodes } from '@core/systemError'

export type MapCustomLayersErrorName =
  | 'urlInvalid'
  | 'urlNotAllowed'
  | 'hostNotFound'
  | 'redirectNotFollowed'
  | 'responseTooLarge'
  | 'timeout'
  | 'fetchFailed'
  | 'unreachable'
  | 'notCapabilities'
  | 'noLayers'
  | 'invalidLayers'
  | 'tooManyLayers'
  | 'busy'

// i18n keys live in core/i18n/resources/<lang>/appErrors.js, object mapCustomLayers
export const MAP_CUSTOM_LAYERS_ERROR_KEY_PREFIX = 'appErrors:mapCustomLayers.'

// the remote service failed (502/504) or this server is saturated (503); every other error is the caller's input (400)
const statusCodeByName: Partial<Record<MapCustomLayersErrorName, number>> = {
  timeout: StatusCodes.GATEWAY_TIMEOUT,
  fetchFailed: StatusCodes.BAD_GATEWAY,
  unreachable: StatusCodes.BAD_GATEWAY,
  busy: StatusCodes.SERVICE_UNAVAILABLE,
}

/**
 * Creates the error sent to the client for a custom map layer problem.
 * @param {MapCustomLayersErrorName} name - The error name (last part of the i18n key).
 * @param {object} [params] - The i18n parameters.
 * @returns {SystemError} The error, with its HTTP status code.
 */
export const newMapCustomLayersError = (
  name: MapCustomLayersErrorName,
  params?: Record<string, unknown>
): SystemError =>
  new SystemError(
    `${MAP_CUSTOM_LAYERS_ERROR_KEY_PREFIX}${name}`,
    params,
    statusCodeByName[name] ?? StatusCodes.BAD_REQUEST
  )

/**
 * Tells whether an error is a custom map layer error, optionally of one of the given names.
 * @param {unknown} error - The error.
 * @param {MapCustomLayersErrorName[]} [names] - The accepted names; any name when omitted.
 * @returns {boolean} True when the error matches.
 */
export const isMapCustomLayersError = (error: unknown, names?: MapCustomLayersErrorName[]): boolean => {
  if (!(error instanceof SystemError) || !error.key.startsWith(MAP_CUSTOM_LAYERS_ERROR_KEY_PREFIX)) return false
  if (!names) return true
  const name = error.key.slice(MAP_CUSTOM_LAYERS_ERROR_KEY_PREFIX.length)
  return (names as string[]).includes(name)
}
