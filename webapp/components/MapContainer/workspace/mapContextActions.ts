import { useMapContext } from '../MapContext'

export type MapContextActions = {
  onBaseLayerUpdate: (baseLayer: object) => void
  onOptionUpdate: (params: { option: string; value: boolean }) => void
}

/**
 * Returns the functions of the map context (MapContext.js is untyped JavaScript).
 * @returns {MapContextActions} The base layer and option setters.
 */
export const useMapContextActions = (): MapContextActions => useMapContext() as MapContextActions
