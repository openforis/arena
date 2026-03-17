import * as ProcessUtils from '@core/processUtils'

const mapProviders = {
  planet: 'planet',
} as const

type MapProvider = (typeof mapProviders)[keyof typeof mapProviders]

const mapApiKeyByProvider: Record<MapProvider, string | undefined> = {
  [mapProviders.planet]: ProcessUtils.ENV.mapApiKeyPlanet,
}

const tileUrlTemplateByProvider: Record<MapProvider, string> = {
  [mapProviders.planet]:
    'https://tiles2.planet.com/basemaps/v1/planet-tiles/planet_medres_normalized_analytic_{period}_mosaic/gmap/{z}/{x}/{y}?api_key={apiKey}&proc={proc}',
}

type GetMapTileUrlParams = {
  provider: MapProvider
  x: string | number
  y: string | number
  z: string | number
  period?: string | null
  apiKey?: string | null
  proc?: string
}

const getMapTileUrl = ({
  provider,
  x,
  y,
  z,
  period = null,
  apiKey = null,
  proc = 'rgb',
}: GetMapTileUrlParams): string | null => {
  const urlTemplate = tileUrlTemplateByProvider[provider]
  if (!urlTemplate) return null

  return urlTemplate
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(z))
    .replace('{period}', String(period))
    .replace('{apiKey}', String(apiKey))
    .replace('{proc}', proc)
}

export const MapUtils = {
  mapApiKeyByProvider,
  getMapTileUrl,
  mapProviders,
}
