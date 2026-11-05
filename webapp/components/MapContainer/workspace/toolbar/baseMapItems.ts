export type SelectableBaseLayerDef = {
  key: string
  name: string
  type?: string
  provider?: string
  apiKeyRequired?: boolean
}

// same value as baseLayerTypes.maplibre in baseLayers.js (Equal Earth)
const MAPLIBRE_TYPE = 'maplibre'

/**
 * Returns the base layers the user can pick: Equal Earth only with experimental features on, API-key layers only when
 * the user has a key for their provider.
 * @param {object} params - Parameters.
 * @param {SelectableBaseLayerDef[]} params.baseLayers - All base layer definitions.
 * @param {boolean} params.experimentalFeaturesEnabled - Whether experimental features are on.
 * @param {Function} params.hasApiKey - (provider) => whether the user has an API key for it.
 * @returns {SelectableBaseLayerDef[]} The selectable base layers, in the given order.
 */
export const getSelectableBaseLayers = <T extends SelectableBaseLayerDef>({
  baseLayers,
  experimentalFeaturesEnabled,
  hasApiKey,
}: {
  baseLayers: T[]
  experimentalFeaturesEnabled: boolean
  hasApiKey: (provider: string) => boolean
}): T[] =>
  baseLayers.filter((baseLayer) => {
    if (baseLayer.type === MAPLIBRE_TYPE) return experimentalFeaturesEnabled
    if (baseLayer.apiKeyRequired) return hasApiKey(baseLayer.provider ?? '')
    return true
  })
