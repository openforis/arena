import { useMapEvents } from 'react-leaflet'

export const useMapLayerToggle = ({ layerName, onAdd, onRemove }) => {
  useMapEvents({
    overlayadd(event) {
      if (event.name === layerName && onAdd) {
        onAdd()
      }
    },
    overlayremove(event) {
      if (event.name === layerName && onRemove) {
        onRemove()
      }
    },
  })
}
