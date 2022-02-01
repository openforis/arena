import * as StringUtils from '@core/stringUtils'

export const baseLayerProviders = {
  planet: 'planet',
}

const planetDefaultPeriod = { year: '2021', month: '12' }

export const baseLayerUrlByProviderFunction = {
  [baseLayerProviders.planet]: ({ period = planetDefaultPeriod, apiKey }) => {
    const periodKey = `${period.year}_${StringUtils.padStart(2, '0')(period.month)}`
    return `https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_${periodKey}_mosaic/gmap/{z}/{x}/{y}.png?api_key=${apiKey}`
  },
}

export const planetAttribution = 'Planet Labs PBC'

export const baseLayers = [
  {
    key: 'ESRI World Imagery',
    name: 'ESRI World Imagery (satellite)',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    key: 'ESRI Topographic',
    name: 'ESRI Topographic',
    attribution: 'Esri, CGIAR, USGS | Esri, HERE, Garmin, SafeGraph, FAO, METI/NASA, USGS, EPA, NPS',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'ESRI Terrain',
    name: 'ESRI Terrain',
    attribution: 'Esri, NASA, NGA, USGS | VITA, Esri, HERE, Garmin, SafeGraph, METI/NASA, USGS, EPA, NPS, USDA',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}.png',
  },
  {
    key: 'OpenStreetMap',
    name: 'OpenStreetMap',
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  // Planet Labs maps
  {
    key: `planet_${planetDefaultPeriod.year}_${planetDefaultPeriod.month}`,
    name: 'Planet',
    attribution: 'Planet Labs PBC',
    apiKeyRequired: true,
    provider: baseLayerProviders.planet,
    periodSelectorAvailable: true,
    url: baseLayerUrlByProviderFunction[baseLayerProviders.planet],
  },
]

export const defaultBaseLayer = baseLayers[0]
