import * as ProcessUtils from '@core/processUtils'

const mapProviders = {
  planet: 'planet',
}

const mapApiKeyByProvider = {
  [mapProviders.planet]: ProcessUtils.ENV.mapApiKeyPlanet,
}

const tileUrlTemplateByProvider = {
  [mapProviders.planet]:
    // 'https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_{period}_mosaic/gmap/{z}/{x}/{y}.png?api_key={apiKey}',
    'https://tiles2.planet.com/basemaps/v1/planet-tiles/planet_medres_normalized_analytic_{period}_mosaic/gmap/{z}/{x}/{y}?api_key={apiKey}',
}

const getMapTileUrl = ({ provider, x, y, z, period = null, apiKey = null }) => {
  const urlTemplate = tileUrlTemplateByProvider[provider]
  if (!urlTemplate) return null

  return urlTemplate
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z)
    .replace('{period}', period)
    .replace('{apiKey}', apiKey)
}

export const MapUtils = {
  mapApiKeyByProvider,
  getMapTileUrl,
  mapProviders,
}
