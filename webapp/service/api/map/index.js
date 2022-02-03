import axios from 'axios'

import { MapUtils } from '@core/map/mapUtils'

export const fetchAvailableMapPeriods = async ({ provider }) => {
  if (provider === MapUtils.mapProviders.planet) {
    const { data } = await axios.get(`/api/geo/map/${provider}/available_montly_periods`)
    return data
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
