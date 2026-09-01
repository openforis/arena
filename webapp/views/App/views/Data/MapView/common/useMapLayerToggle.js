import { useMapEvents } from 'react-leaflet'

export const useMapLayerToggle = ({ layerName, layerKey, onAdd, onRemove }) => {
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
