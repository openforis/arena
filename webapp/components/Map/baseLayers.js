import * as StringUtils from '@core/stringUtils'

const baseLayerProviders = {
  esri: 'ESRI',
  openStreetMap: 'OpenStreetMap',
  planet: 'planet',
}

export const baseLayerAttribution = {
  planet: 'Planet Labs PBC',
}

const planetDefaultPeriod = { year: '2021', month: '12' }

const _getPeriodKey = (period) => `${period.year}-${StringUtils.padStart(2, '0')(period.month)}`

const getArenaMapUrl = ({ provider, period }) =>
  `/api/geo/map/${provider}/tile/{z}/{y}/{x}?period=${_getPeriodKey(period)}`

export const baseLayerUrlByProviderFunction = {
  [baseLayerProviders.planet]: ({ period = planetDefaultPeriod }) =>
    getArenaMapUrl({ provider: baseLayerProviders.planet, period }),
}

export const baseLayers = [
  {
    key: 'ESRI World Imagery',
    name: 'ESRI World Imagery (satellite)',
    provider: baseLayerProviders.esri,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    key: 'ESRI Topographic',
    name: 'ESRI Topographic',
    provider: baseLayerProviders.esri,
    attribution: 'Esri, CGIAR, USGS | Esri, HERE, Garmin, SafeGraph, FAO, METI/NASA, USGS, EPA, NPS',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'ESRI Terrain',
    name: 'ESRI Terrain',
    provider: baseLayerProviders.esri,
    attribution: 'Esri, NASA, NGA, USGS | VITA, Esri, HERE, Garmin, SafeGraph, METI/NASA, USGS, EPA, NPS, USDA',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'OpenStreetMap',
    name: 'OpenStreetMap',
    provider: baseLayerProviders.openStreetMap,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  // Planet Labs maps
  {
    key: 'planet_monthly_mosaics',
    name: 'Planet (monthly mosaics)',
    attribution: baseLayerAttribution.planet,
    provider: baseLayerProviders.planet,
    periodSelectorAvailable: true,
    url: getArenaMapUrl({ provider: baseLayerProviders.planet, period: planetDefaultPeriod }),
  },
]

export const defaultBaseLayer = baseLayers[0]
