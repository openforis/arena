import { useEffect } from 'react'

import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'

/**
 * Registers or unregisters a map layer with the layers panel based on experimental features,
 * layer activity, and point availability.
 * @param {object} params - Parameters.
 * @param {boolean} [params.active] - Whether the layer is currently active/visible.
 * @param {Function} params.flyToPoint - Callback to fly the map to a specific point.
 * @param {string} params.layerKey - Unique key identifying the layer.
 * @param {string} params.layerName - Display name of the layer in the panel.
 * @param {Array} params.points - Array of points belonging to this layer.
 */
export const useLayerRegistration = ({ active = true, flyToPoint, layerKey, layerName, points }) => {
  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const { registerLayer, unregisterLayer } = useMapLayersPanel()

  useEffect(() => {
    if (!experimentalFeatures || !active || points.length === 0) {
      unregisterLayer({ key: layerKey })
      return
    }
    registerLayer({ key: layerKey, layerName, points, flyToPoint })
  }, [active, experimentalFeatures, flyToPoint, layerKey, layerName, points, registerLayer, unregisterLayer])
}
