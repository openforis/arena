import axios from 'axios'

import { MapUtils } from '@core/map/mapUtils'
import { periodTypes } from '@webapp/components/Map/baseLayers'

export const fetchAvailableMapPeriods = async ({ provider, periodType }) => {
  if (provider === MapUtils.mapProviders.planet) {
    // const { data } = await axios.get(`/api/geo/map/${provider}/available_montly_periods`)
    // return data
    if (periodType === periodTypes.monthly) {
      return [
        { year: 2020, month: 9 },
        { year: 2020, month: 10 },
        { year: 2020, month: 11 },
        { year: 2020, month: 12 },
        { year: 2021, month: 1 },
        { year: 2021, month: 2 },
        { year: 2021, month: 3 },
        { year: 2021, month: 4 },
        { year: 2021, month: 5 },
        { year: 2021, month: 6 },
        { year: 2021, month: 7 },
        { year: 2021, month: 8 },
        { year: 2021, month: 9 },
        { year: 2021, month: 10 },
        { year: 2021, month: 11 },
        { year: 2021, month: 12 },
      ]
    } else {
      return [
        { year: 2015, month: 12, yearTo: 2016, monthTo: 5 },
        { year: 2016, month: 6, yearTo: 2016, monthTo: 11 },
        { year: 2016, month: 12, yearTo: 2017, monthTo: 5 },
        { year: 2017, month: 6, yearTo: 2017, monthTo: 11 },
        { year: 2017, month: 12, yearTo: 2018, monthTo: 5 },
        { year: 2018, month: 6, yearTo: 2018, monthTo: 11 },
        { year: 2018, month: 12, yearTo: 2019, monthTo: 5 },
        { year: 2019, month: 6, yearTo: 2019, monthTo: 11 },
        { year: 2019, month: 12, yearTo: 2020, monthTo: 5 },
        { year: 2020, month: 6, yearTo: 2020, monthTo: 8 },
      ]
    }
  }
  return null
}

export const fetchElevation = async ({ surveyId, lat, lng }) => {
  try {
    const { data } = await axios.get(`/api/survey/${surveyId}/geo/map/elevation`, {
      params: { lat, lng },
      timeout: 5000,
    })
    return data
  } catch {
    return null
  }
}

export const testMapApiKey = async ({ provider, apiKey }) => {
  try {
    const mosaics = await fetchAvailableMapPeriods({ provider, apiKey })
    return mosaics.length > 0
  } catch (_e) {
    return false
  }
}

/* Query the user given url through our server to avoid CORS violations. The layer urls are not proxied through our server yet, but maybe they should. 
   If you get CORS problems, that will be the solution.
*/
export const fetchMapWmtsCapabilities = async ({ surveyId, url }) => {
  try {
    const { data } = await axios.get(`/api/survey/${surveyId}/geo/map/wmts/capabilities/`, { params: { url } })
    return data
  } catch {
    return null
  }
}
