import axios from 'axios'

const planetMosaicNameRegEx = /global_monthly_(\d{4})_(\d{2})_mosaic/

export const fetchAvailableMapPeriods = async ({ provider, apiKey }) => {
  if (provider === 'planet') {
    const {
      data: { mosaics },
    } = await axios.get(
      `https://api.planet.com/basemaps/v1/mosaics?api_key=${apiKey}&_page_size=1000&name__contains=global_monthly_`,
      {
        transformRequest: (data, headers) => {
          delete headers.common['Authorization']
          delete headers['socketid']
          return data
        },
      }
    )
    return mosaics
      .map(({ name }) => {
        const matcher = name.match(planetMosaicNameRegEx)
        return matcher ? { year: matcher[1], month: Number(matcher[2]) } : null
      })
      .filter(Boolean) // exclude "mutate" mosaics
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
