import axios from 'axios'

import { MapUtils } from '@core/map/mapUtils'
import { periodTypes } from '@webapp/components/Map/baseLayers'

const monthlyPeriodsDateStart = new Date(2020, 7)
const biannualPeriodsDateStart = new Date(2015, 11)
const biannualPeriodsDateEnd = new Date(2020, 8)

const generateMonthlyPeriods = () => {
  const dateStart = monthlyPeriodsDateStart
  const now = new Date()
  const dateEnd = new Date(now.getFullYear(), now.getMonth() - 1)

  let currentDate = dateStart
  const periods = []
  while (currentDate.getFullYear() < dateEnd.getFullYear() || currentDate.getMonth() < dateEnd.getMonth()) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    periods.push({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    })
  }
  return periods
}

const generateBiannualPeriods = () => {
  const dateStart = biannualPeriodsDateStart
  const dateEnd = biannualPeriodsDateEnd

  const periods = []
  let periodStartDate = dateStart
  let periodEndDate = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 6)
  while (periodEndDate.getFullYear() < dateEnd.getFullYear() || periodEndDate.getMonth() < dateEnd.getMonth()) {
    periods.push({
      year: periodStartDate.getFullYear(),
      month: periodStartDate.getMonth() + 1,
      yearTo: periodEndDate.getFullYear(),
      monthTo: periodEndDate.getMonth(),
    })
    periodStartDate = periodEndDate
    periodEndDate = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 6)
  }

  // add last period if it falls in a month not multiple of 6
  if ((biannualPeriodsDateEnd.getMonth() + 1) % 6 !== 0) {
    periods.push({
      year: biannualPeriodsDateEnd.getFullYear(),
      month: 6,
      yearTo: biannualPeriodsDateEnd.getFullYear(),
      monthTo: biannualPeriodsDateEnd.getMonth(),
    })
  }
  return periods
}

export const fetchAvailableMapPeriods = async ({ provider, periodType }) => {
  if (provider === MapUtils.mapProviders.planet) {
    // const { data } = await axios.get(`/api/geo/map/${provider}/available_montly_periods`)
    // return data
    if (periodType === periodTypes.monthly) {
      return generateMonthlyPeriods()
    } else {
      return generateBiannualPeriods()
    }
  }
  return null
}

export const fetchAltitude = async ({ surveyId, lat, lng }) => {
  try {
    const { data } = await axios.get(`/api/survey/${surveyId}/geo/map/altitude`, { params: { lat, lng } })
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
