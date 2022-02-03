import axios from 'axios'

import { MapUtils } from '@core/map/mapUtils'

export const fetchAvailableMapPeriods = async ({ provider }) => {
  if (provider === MapUtils.mapProviders.planet) {
    // const { data } = await axios.get(`/api/geo/map/${provider}/available_montly_periods`)
    // return data
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
  }
  return null
}

export const testMapApiKey = async ({ provider, apiKey }) => {
  try {
    const mosaics = await fetchAvailableMapPeriods({ provider, apiKey })
    return mosaics.length > 0
  } catch (_e) {
    return false
  }
}
