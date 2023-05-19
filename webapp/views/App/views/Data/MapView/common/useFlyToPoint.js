import { useCallback, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'

export const useFlyToPoint = ({ points, onRecordEditClick = null }) => {
  const map = useMap()

  const [state, setState] = useState({})
  const { currentPointShown, currentPointPopupOpen } = state

  // Have a Reference to points for opening popups automatically
  const markersByKeyRef = useRef({})

  const getPointKey = useCallback((point) => point?.properties?.key, [])

  const openPopupOfPoint = useCallback(
    async (point) => {
      const marker = markersByKeyRef.current[getPointKey(point)]
      if (marker) {
        // marker has been rendered already
        marker.openPopup()
      } else {
        // marker is not visible (it's clustered); add it to the map as CoordinateAttributeMarker
        if (currentPointShown) {
          // unmount current marker
          await setState({ currentPointShown: null })
        }
        setState({ currentPointShown: point, currentPointPopupOpen: true })
      }
    },
    [currentPointShown, getPointKey]
  )

  const getPointIndex = useCallback((point) => points.findIndex((p) => getPointKey(p) === getPointKey(point)), [points])

  const getNextPoint = useCallback(
    (point) => {
      const index = getPointIndex(point)
      return points[(index + 1) % points.length]
    },
    [getPointIndex, points]
  )

  const getPreviousPoint = useCallback(
    (point) => {
      const index = getPointIndex(point)
      return points[index > 0 ? index - 1 : points.length - 1]
    },
    [getPointIndex, points]
  )

  const flyTo = useCallback(
    (point) => {
      // close record edit popup
      onRecordEditClick?.(null)

      const [longitude, latitude] = point.geometry.coordinates
      map.flyTo([latitude, longitude], map.getMaxZoom())
      map.once('zoomend', () => openPopupOfPoint(point))
    },
    [map, onRecordEditClick, openPopupOfPoint]
  )

  const flyToNextPoint = useCallback(
    (point) => {
      const nextPoint = getNextPoint(point)
      flyTo(nextPoint)
    },
    [flyTo, getNextPoint]
  )

  const flyToPreviousPoint = useCallback(
    (point) => {
      const previousPoint = getPreviousPoint(point)
      flyTo(previousPoint)
    },
    [flyTo, getPreviousPoint]
  )

  const setMarkerByKey = useCallback(({ key, marker }) => {
    if (marker) {
      markersByKeyRef.current[key] = marker
    } else {
      delete markersByKeyRef.current[key]
    }
  }, [])

  const onCurrentPointPopupClose = useCallback(
    () => setState((statePrev) => ({ ...statePrev, currentPointPopupOpen: false })),
    []
  )

  return {
    currentPointShown,
    currentPointPopupOpen,
    flyToNextPoint,
    flyToPreviousPoint,
    onCurrentPointPopupClose,
    openPopupOfPoint,
    setMarkerByKey,
  }
}
