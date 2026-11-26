import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { Numbers } from '@openforis/arena-core'

import { appIconMarkup } from '@webapp/components/AppIcon'

import type { MapPointMarker, RecordEditClickHandler, SetMarkerByKey } from './mapPointTypes'

// shown at the destination until the popup of the point opens
const flyToLoaderIcon = L.divIcon({
  className: 'map-view__fly-to-loader',
  html: appIconMarkup('spinner'),
  iconSize: [28, 28],
})
// the loader is removed anyway if no popup opens (e.g. layer hidden during the flight)
const flyToLoaderTimeoutAfterMoveEnd = 2000

// GeoJSON point feature of a map layer: [longitude, latitude] coordinates and a key unique in the layer
export type FlyToPointFeature = {
  geometry: { coordinates: number[] }
  properties: { key: string }
}

export type FlyToPointFunction<P extends FlyToPointFeature = FlyToPointFeature> = (point: P) => void

export const useFlyToPoint = <P extends FlyToPointFeature>({
  points,
  onRecordEditClick = null,
  zoomToMaxLevel = true,
}: {
  points: P[]
  onRecordEditClick?: RecordEditClickHandler | null
  zoomToMaxLevel?: boolean
}) => {
  const map = useMap()

  const [state, setState] = useState<{ currentPointShown?: P | null; currentPointPopupOpen?: boolean }>({})
  const { currentPointShown, currentPointPopupOpen } = state

  // Have a Reference to points for opening popups automatically
  const markersByKeyRef = useRef<Record<string, MapPointMarker>>({})

  // removes the loader and the listeners of the last flight, if still pending
  const pendingFlightCleanupRef = useRef<(() => void) | null>(null)

  const getPointKey = useCallback((point: FlyToPointFeature | null) => point?.properties?.key, [])

  const openPopupOfPoint = useCallback(
    async (point: P) => {
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

  const getPointIndex = useCallback(
    (point: P) => points.findIndex((p) => getPointKey(p) === getPointKey(point)),
    [getPointKey, points]
  )

  const getPointByOffset = useCallback(
    (point: P, offset: number): P => {
      const index = getPointIndex(point)
      const indexNext = Numbers.absMod(points.length)(index + offset)
      return points[indexNext]
    },
    [getPointIndex, points]
  )
  const getNextPoint = useCallback((point: P) => getPointByOffset(point, 1), [getPointByOffset])
  const getPreviousPoint = useCallback((point: P) => getPointByOffset(point, -1), [getPointByOffset])

  const flyToPoint: FlyToPointFunction<P> = useCallback(
    (point) => {
      // close record edit popup
      onRecordEditClick?.(null)

      pendingFlightCleanupRef.current?.()
      // the open popup would show the previous point until the new one opens
      map.closePopup()
      // stopping a running pan fires moveend: do it before listening to it
      map.stop()

      const [longitude, latitude] = point.geometry.coordinates
      const latLng = L.latLng(latitude, longitude)
      const loader = L.marker(latLng, { icon: flyToLoaderIcon, interactive: false, keyboard: false }).addTo(map)
      const cleanup = () => {
        map.off('moveend', onMoveEnd)
        map.off('popupopen', cleanup)
        loader.remove()
        if (pendingFlightCleanupRef.current === cleanup) {
          pendingFlightCleanupRef.current = null
        }
      }
      const onMoveEnd = () => {
        openPopupOfPoint(point)
        setTimeout(cleanup, flyToLoaderTimeoutAfterMoveEnd)
      }
      pendingFlightCleanupRef.current = cleanup
      map.once('moveend', onMoveEnd)
      map.once('popupopen', cleanup)

      const nextZoomLevel = zoomToMaxLevel ? map.getMaxZoom() : map.getZoom()
      if (nextZoomLevel === map.getZoom() && map.getBounds().contains(latLng)) {
        // point already in view: a short pan instead of the 2 seconds flight
        map.panTo(latLng)
      } else {
        map.flyTo(latLng, nextZoomLevel, { duration: 2, easeLinearity: 0.5 })
      }
    },
    [map, onRecordEditClick, openPopupOfPoint, zoomToMaxLevel]
  )

  useEffect(() => () => pendingFlightCleanupRef.current?.(), [])

  const flyToNextPoint: FlyToPointFunction<P> = useCallback(
    (point) => {
      const nextPoint = getNextPoint(point)
      flyToPoint(nextPoint)
    },
    [flyToPoint, getNextPoint]
  )

  const flyToPreviousPoint: FlyToPointFunction<P> = useCallback(
    (point) => {
      const previousPoint = getPreviousPoint(point)
      flyToPoint(previousPoint)
    },
    [flyToPoint, getPreviousPoint]
  )

  const setMarkerByKey: SetMarkerByKey = useCallback(({ key, marker }) => {
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

  // Stable wrapper so the panel always calls the latest flyToPoint without re-registering on popup state changes
  const flyToPointRef = useRef(flyToPoint)
  useEffect(() => {
    flyToPointRef.current = flyToPoint
  }, [flyToPoint])
  const stableFlyToPoint: FlyToPointFunction<P> = useCallback((point) => flyToPointRef.current(point), [])

  return {
    currentPointShown,
    currentPointPopupOpen,
    flyToPoint: stableFlyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    onCurrentPointPopupClose,
    openPopupOfPoint,
    setMarkerByKey,
  }
}
