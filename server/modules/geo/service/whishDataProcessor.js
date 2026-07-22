import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'

const whispApiUrl = 'https://whisp.openforis.org/api/'

const whispApiPostGeojsonUrl = `${whispApiUrl}submit/geojson`
const whispApiGeoProcessingStatusUrl = `${whispApiUrl}status`

const processingStatusPollingPeriod = 2000 // 2 seconds

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
  return new SystemError('appErrors:geoWhispApiError', { whispStatus, message }, StatusCodes.BAD_GATEWAY)
}

const waitForProcessing = async ({ token }) => {
  const url = `${whispApiGeoProcessingStatusUrl}/${token}`
  const headers = getRequestHeaders()

  // Start an indefinite loop

  while (true) {
    let response
    try {
      response = await axios.get(url, { headers })
    } catch (error) {
      throw wrapWhispApiError(error)
    }
    const { data: responseData } = response
    const { code, data } = responseData

    console.log(`===> Processing status: ${code}`)
    switch (code) {
      case 'analysis_completed':
        // Exit the async function (and the loop) and resolve with data
        return data
      case 'analysis_processing':
        // The loop continues after the await
        break
      default:
        throw new Error('Error fetching Whisp processing status')
    }
    // If not completed or an error, wait 2 seconds before the next iteration
    await wait(processingStatusPollingPeriod)
  }
}

const generateData = async ({ geojson }) => {
  const requestPayload = { ...geojson, analysisOptions: { async: true } }
  const headers = getRequestHeaders()
  console.log('===> Sending request to Whisp API for processing')
  let processStartData
  try {
    ;({ data: processStartData } = await axios.post(whispApiPostGeojsonUrl, requestPayload, { headers }))
  } catch (error) {
    throw wrapWhispApiError(error)
  }

  console.log('===> Received response from Whisp API, waiting for processing to complete')
  const token = processStartData?.data?.token

  console.log(`===> Processing token: ${token}, waiting for processing to complete...`)
  const data = await waitForProcessing({ token })
  console.log('===> Processing completed, received data from Whisp API')
  return { token, data }
}

export const WhishDataProcessor = { generateData }
