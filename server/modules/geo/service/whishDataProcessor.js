import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'

const whispApiUrl = 'https://whisp.openforis.org/api/'

const whispApiPostGeojsonUrl = `${whispApiUrl}geojson`
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

const waitForProcessing = async ({ token }) => {
  const url = `${whispApiGeoProcessingStatusUrl}/${token}`
  const headers = getRequestHeaders()

  // Start an indefinite loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await axios.get(url, { headers })
    const { data: responseData } = response
    const { code, data } = responseData

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
  const { data: processStartData } = await axios.post(whispApiPostGeojsonUrl, requestPayload, { headers })

  const token = processStartData?.data?.token

  const data = await waitForProcessing({ token })
  return { token, data }
}

export const WhishDataProcessor = { generateData }
