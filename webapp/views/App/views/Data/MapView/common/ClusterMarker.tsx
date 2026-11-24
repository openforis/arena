import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type L from 'leaflet'
import { Marker, Popup, useMap } from 'react-leaflet'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useMapContextOptions } from '@webapp/components/MapContainer/MapContext'

import type { ClusterIconCreator, MapClusterFeature, MapPointFeature, MapPointProperties } from './mapPointTypes'

type ClusteredPointsPopupProps<P extends MapPointProperties> = {
  clusteredPoints: MapPointFeature<P>[]
  openPopupOfPoint: (point: MapPointFeature<P>) => void
  pointLabelFunction: (point: MapPointFeature<P>) => string
}

const ClusteredPointsPopup = <P extends MapPointProperties>(props: ClusteredPointsPopupProps<P>) => {
  const { clusteredPoints, openPopupOfPoint, pointLabelFunction } = props

  return (
    <Popup className="cluster-marker__clustered-points-popup">
      <ul>
        {clusteredPoints.map((point) => {
          const { properties } = point
          const { key } = properties
          return (
            <li key={key}>
              <button
                type="button"
                className="cluster-marker__clustered-point-btn"
                onClick={() => openPopupOfPoint(point)}
              >
                <LabelWithTooltip label={pointLabelFunction(point)} />
              </button>
            </li>
          )
        })}
      </ul>
    </Popup>
  )
}

type ClusterMarkerProps<P extends MapPointProperties> = {
  cluster: MapClusterFeature
  clusterExpansionZoomExtractor: (cluster: MapClusterFeature) => number
  clusterIconCreator: ClusterIconCreator
  color: string
  getClusterLeaves: (cluster: MapClusterFeature) => MapPointFeature<P>[]
  openPopupOfPoint: (point: MapPointFeature<P>) => void
  // label of a point in the list of the clustered points
  pointLabelFunction: (point: MapPointFeature<P>) => string
  totalPoints: number
}

export const ClusterMarker = <P extends MapPointProperties>(props: ClusterMarkerProps<P>) => {
  const {
    cluster,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    color,
    getClusterLeaves,
    openPopupOfPoint,
    pointLabelFunction,
    totalPoints,
  } = props

  const map = useMap()

  const { geometry, id, properties } = cluster
  const { point_count: pointCount } = properties
  const [longitude, latitude] = geometry.coordinates

  const position = useMemo((): [number, number] => [latitude, longitude], [latitude, longitude])

  const markerRef = useRef<L.Marker>(null)
  const [clusteredPoints, setClusteredPoints] = useState<MapPointFeature<P>[]>([])

  const options = useMapContextOptions()
  const { showLocationMarkers } = options

  // hide cluster marker if showLocationMarkers is false
  useEffect(() => {
    const marker = markerRef.current
    marker.setOpacity(showLocationMarkers ? 1 : 0)
  }, [markerRef, showLocationMarkers])

  const onClick = useCallback(() => {
    const maxZoom = map.getMaxZoom()

    if (map.getZoom() === maxZoom) {
      // prepare popup content
      const leaves = getClusterLeaves(cluster)
      setClusteredPoints(leaves)
    } else {
      markerRef.current.closePopup()

      const expansionZoom = Math.min(clusterExpansionZoomExtractor(cluster), maxZoom)
      map.setView(position, expansionZoom, {
        animate: true,
      })
    }
  }, [cluster, clusterExpansionZoomExtractor, getClusterLeaves, map, position])

  const size = 10 + (pointCount / totalPoints) * 40

  return (
    <Marker
      key={`cluster-${id}`}
      position={position}
      icon={clusterIconCreator({ count: pointCount, size, color })}
      eventHandlers={{ click: onClick }}
      ref={markerRef}
    >
      <ClusteredPointsPopup
        clusteredPoints={clusteredPoints}
        openPopupOfPoint={openPopupOfPoint}
        pointLabelFunction={pointLabelFunction}
      />
    </Marker>
  )
}
