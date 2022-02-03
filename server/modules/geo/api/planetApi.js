import axios from 'axios'

import { MapUtils } from '@core/map/mapUtils'

const planetMosaicNameRegEx = /global_monthly_(\d{4})_(\d{2})_mosaic/

const fetchAvailableMonthlyMosaicsPeriods = async () => {
  const apiKey = MapUtils.mapApiKeyByProvider[MapUtils.mapProviders.planet]
  const {
    data: { mosaics },
  } = await axios.get(
    `https://api.planet.com/basemaps/v1/mosaics?api_key=${apiKey}&_page_size=1000&name__contains=global_monthly_`
  )
  return mosaics
    .map(({ name }) => {
      const matcher = name.match(planetMosaicNameRegEx)
      return matcher ? { year: matcher[1], month: Number(matcher[2]) } : null
    })
    .filter(Boolean) // exclude "mutate" mosaics
}

export const PlanetApi = {
  fetchAvailableMonthlyMosaicsPeriods,
}
