import { useMapEvents } from 'react-leaflet'

/**
 * Calls onAdd / onRemove when the overlay of a layer is checked / unchecked in the layers control.
 * @param {object} params - Parameters.
 * @param {string} params.layerName - The overlay name.
 * @param {string} [params.layerKey] - When set, overlays whose name includes it match (instead of the exact name).
 * @param {() => void} [params.onAdd] - Called when the overlay is checked.
 * @param {() => void} [params.onRemove] - Called when the overlay is unchecked.
 */
export const useMapLayerToggle = ({
  layerName,
  layerKey,
  onAdd,
  onRemove,
}: {
  layerName: string
  layerKey?: string
  onAdd?: () => void
  onRemove?: () => void
}) => {
  const matchesLayer = (eventName) => (layerKey ? eventName.includes(layerKey) : eventName === layerName)

  useMapEvents({
    overlayadd(event) {
      if (onAdd && matchesLayer(event.name)) {
        onAdd()
      }
    },
    overlayremove(event) {
      if (onRemove && matchesLayer(event.name)) {
        onRemove()
      }
    },
  })
}
