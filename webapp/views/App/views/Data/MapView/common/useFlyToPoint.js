import { useCallback, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'

import { Numbers } from '@openforis/arena-core'

export const useFlyToPoint = ({ points, onRecordEditClick = null, zoomToMaxLevel = true }) => {
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

  const getPointByOffset = useCallback(
    (point, offset) => {
      const index = getPointIndex(point)
      const indexNext = Numbers.absMod(points.length)(index + offset)
      return points[indexNext]
    },
    [getPointIndex, points]
  )
  const getNextPoint = useCallback((point) => getPointByOffset(point, 1), [getPointByOffset])
  const getPreviousPoint = useCallback((point) => getPointByOffset(point, -1), [getPointByOffset])

  const flyToPoint = useCallback(
    (point) => {
      // close record edit popup
      onRecordEditClick?.(null)

      const [longitude, latitude] = point.geometry.coordinates
      const nextZoomLevel = zoomToMaxLevel ? map.getMaxZoom() : undefined
      map.flyTo([latitude, longitude], nextZoomLevel)
      map.once('zoomend', () => openPopupOfPoint(point))
    },
    [map, onRecordEditClick, openPopupOfPoint, zoomToMaxLevel]
  )

  const flyToNextPoint = useCallback(
    (point) => {
      const nextPoint = getNextPoint(point)
      flyToPoint(nextPoint)
    },
    [flyToPoint, getNextPoint]
  )

  const flyToPreviousPoint = useCallback(
    (point) => {
      const previousPoint = getPreviousPoint(point)
      flyToPoint(previousPoint)
    },
    [flyToPoint, getPreviousPoint]
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
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    onCurrentPointPopupClose,
    openPopupOfPoint,
    setMarkerByKey,
  }
}
