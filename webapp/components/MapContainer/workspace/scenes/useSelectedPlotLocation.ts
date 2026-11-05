import L from 'leaflet'
import { useEffect, useState } from 'react'

export type PlotLocation = { lat: number; lng: number }

/**
 * Finds the location of a popup that is open on the map.
 *
 * @param {L.Map} map - Map.
 * @returns {PlotLocation|null} Popup location, or null when no popup is open.
 */
const findOpenPopupLocation = (map: L.Map): PlotLocation | null => {
  let location: PlotLocation | null = null
  map.eachLayer((layer) => {
    if (!(layer instanceof L.Popup)) return
    const latLng = layer.getLatLng()
    if (latLng) location = { lat: latLng.lat, lng: latLng.lng }
  })
  return location
}

/**
 * Returns the location of the last opened map popup (record, sampling point or uploaded feature): on Data › Map,
 * that is the plot the user last selected.
 *
 * @param {L.Map} map - Map.
 * @returns {PlotLocation|null} Location, or null until a popup has been opened.
 */
export const useSelectedPlotLocation = (map: L.Map): PlotLocation | null => {
  const [location, setLocation] = useState<PlotLocation | null>(() => findOpenPopupLocation(map))

  useEffect(() => {
    /**
     * Remembers the location of the opened popup.
     *
     * @param {L.PopupEvent} event - Leaflet popupopen event.
     * @returns {void}
     */
    const onPopupOpen = (event: L.PopupEvent): void => {
      const latLng = event.popup.getLatLng()
      if (latLng) setLocation({ lat: latLng.lat, lng: latLng.lng })
    }
    map.on('popupopen', onPopupOpen)
    return () => {
      map.off('popupopen', onPopupOpen)
    }
  }, [map])

  return location
}
