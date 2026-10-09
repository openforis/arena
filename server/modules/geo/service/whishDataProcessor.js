import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'

import * as Log from '@server/log/log'

const logger = Log.getLogger('WhispDataProcessor')

const whispApiUrl = 'https://whisp.openforis.org/api/'

const whispApiPostGeojsonUrl = `${whispApiUrl}submit/geojson`
const whispApiGeoProcessingStatusUrl = `${whispApiUrl}status`

const defaultPollingPeriod = 2000 // 2 seconds

// Whisp limits the requests per API key (30 per minute by default, status polling included)
const rateLimitExceededStatus = 429
const rateLimitDefaultWaitMs = 60000
const rateLimitMaxRetries = 10

const getRequestHeaders = () => {
  const apiKey = ProcessUtils.ENV.whispApiKey
  if (!apiKey) {
    throw new Error('WHISP API key not specified')
  }
  return { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Wraps errors coming from the external Whisp API (e.g. its own 401s) so they are never
// mistaken by clients for an Arena authentication error (see appErrorsMiddleware.js on the client).
const wrapWhispApiError = (error) => {
  const whispStatus = error.response?.status
  const message = error.response?.data?.message ?? error.message
  logger.error(`Whisp API error (status ${whispStatus}): ${message}`)
  return new SystemError('appErrors:geoWhispApiError', { whispStatus, message }, StatusCodes.BAD_GATEWAY)
}

// Whisp rate limit error message is like "Rate limit exceeded. Try again in 12 seconds."
const extractRateLimitWaitMs = (error) => {
  const message = error.response?.data?.message ?? ''
  const seconds = Number(/(\d+) seconds/.exec(message)?.[1])
  return seconds > 0 ? (seconds + 1) * 1000 : rateLimitDefaultWaitMs
}

// Sends a request to the Whisp API, waiting and retrying when its rate limit is exceeded
const sendRequest = async (requestFn) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestFn() // NOSONAR
    } catch (error) {
      if (error.response?.status !== rateLimitExceededStatus || attempt >= rateLimitMaxRetries) {
        throw wrapWhispApiError(error)
      }
      const waitMs = extractRateLimitWaitMs(error)
      logger.debug(`Whisp API rate limit exceeded: retrying in ${waitMs}ms`)
      await wait(waitMs) // NOSONAR
    }
  }
}

const waitForProcessing = async ({ token, pollingPeriod }) => {
  const url = `${whispApiGeoProcessingStatusUrl}/${token}`
  const headers = getRequestHeaders()

  // Start an indefinite loop

  while (true) {
    const { data: responseData } = await sendRequest(() => axios.get(url, { headers })) // NOSONAR
    const { code, data, message } = responseData

    switch (code) {
      case 'analysis_completed':
        // Exit the async function (and the loop) and resolve with data
        return data
      case 'analysis_queued':
      case 'analysis_processing':
        // The loop continues after the await
        break
      default:
        throw wrapWhispApiError({ message: `Unexpected Whisp processing status: ${code} ${message ?? ''}` })
    }
    await wait(pollingPeriod) // NOSONAR
  }
}

const generateData = async ({ geojson, analysisOptions = {}, pollingPeriod = defaultPollingPeriod }) => {
  const requestPayload = { ...geojson, analysisOptions: { ...analysisOptions, async: true } }
  const headers = getRequestHeaders()
  const { data: processStartData } = await sendRequest(() =>
    axios.post(whispApiPostGeojsonUrl, requestPayload, { headers })
  )
  const token = processStartData?.data?.token
  if (!token) {
    throw new SystemError(
      'appErrors:geoWhispApiError',
      { message: 'Missing token in Whisp response' },
      StatusCodes.BAD_GATEWAY
    )
  }
  const data = await waitForProcessing({ token, pollingPeriod })
  return { token, data }
}

export const WhishDataProcessor = { generateData }
