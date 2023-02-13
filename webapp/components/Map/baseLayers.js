import * as StringUtils from '@core/stringUtils'

const baseLayerProviders = {
  esri: 'ESRI',
  openStreetMap: 'OpenStreetMap',
  planet: 'planet',
  // wmts: 'WMTS',
}

const baseLayerAttribution = {
  planet: 'Planet Labs PBC',
}

export const periodTypes = {
  monthly: 'monthly',
  biannual: 'biannual',
}

const planetDefaultPeriod = { year: 2021, month: 12 }
const planetDefaultBiannualPeriod = { year: 2020, month: 6, yearTo: 2020, monthTo: 8 }

const _getPeriodKey = (period) => {
  const { year, month, yearTo, monthTo } = period
  return (
    `${year}-${StringUtils.padStart(2, '0')(month)}` +
    (yearTo ? `_${yearTo}-${StringUtils.padStart(2, '0')(monthTo)}` : '')
  )
}

const getArenaMapUrl = ({ surveyId, provider, period }) =>
  `/api/survey/${surveyId}/geo/map/${provider}/tile/{z}/{y}/{x}?period=${_getPeriodKey(period)}`

export const baseLayerUrlByProviderFunction = {
  [baseLayerProviders.planet]: ({ surveyId, period = planetDefaultPeriod }) =>
    getArenaMapUrl({ surveyId, provider: baseLayerProviders.planet, period }),
}

export const baseLayers = [
  {
    key: 'ESRI World Imagery',
    name: 'ESRI World Imagery (satellite)',
    provider: baseLayerProviders.esri,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 17,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    key: 'ESRI Topographic',
    name: 'ESRI Topographic',
    provider: baseLayerProviders.esri,
    attribution: 'Esri, CGIAR, USGS | Esri, HERE, Garmin, SafeGraph, FAO, METI/NASA, USGS, EPA, NPS',
    maxZoom: 16,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'ESRI Terrain',
    name: 'ESRI Terrain',
    provider: baseLayerProviders.esri,
    attribution: 'Esri, NASA, NGA, USGS | VITA, Esri, HERE, Garmin, SafeGraph, METI/NASA, USGS, EPA, NPS, USDA',
    maxZoom: 9,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'OpenStreetMap',
    name: 'OpenStreetMap',
    provider: baseLayerProviders.openStreetMap,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  // {
  //   key: 'WMTS',
  //   name: 'Custom WMTS',
  //   provider: baseLayerProviders.wmts,
  //   attribution: '',
  //   url: ''
  // },

  // Planet Labs maps
  {
    key: 'planet_monthly_mosaics',
    name: 'Planet NICFI (monthly mosaics)',
    attribution: baseLayerAttribution.planet,
    provider: baseLayerProviders.planet,
    periodSelectorAvailable: true,
    periodType: periodTypes.monthly,
    url: getArenaMapUrl({ provider: baseLayerProviders.planet, period: planetDefaultPeriod }),
  },
  {
    key: 'planet_biannual_mosaics',
    name: 'Planet NICFI (biannual mosaics)',
    attribution: baseLayerAttribution.planet,
    provider: baseLayerProviders.planet,
    periodSelectorAvailable: true,
    periodType: periodTypes.biannual,
    url: getArenaMapUrl({ provider: baseLayerProviders.planet, period: planetDefaultBiannualPeriod }),
  },
]

export const defaultBaseLayer = baseLayers[0]
