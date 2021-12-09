import { useMapEvents } from 'react-leaflet'

export const useMapLayerAdd = ({ layerName, callback }) => {
  useMapEvents({
    overlayadd(event) {
      if (event.name === layerName) {
        callback()
      }
    },
  })
}
