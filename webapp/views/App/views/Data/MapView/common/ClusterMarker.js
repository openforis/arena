import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'

export const ClusterMarker = (props) => {
  const {
    cluster,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    color,
    getClusterLeaves,
    openPopupOfPoint,
    totalPoints,
  } = props

  const map = useMap()

  const { properties, id } = cluster
  const { point_count: pointCount } = properties

  const position = useMemo(() => {
    const [longitude, latitude] = cluster.geometry.coordinates
    return [latitude, longitude]
  }, [cluster])

  const markerRef = useRef(null)
  const [clusteredPoints, setClusteredPoints] = useState([])

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
      <Popup>
        <ul>
          {clusteredPoints.map((point) => {
            const { properties } = point
            const { ancestorsKeys, key } = properties
            return (
              <li key={key}>
                <a onClick={() => openPopupOfPoint(point)}>{ancestorsKeys.join(' - ')}</a>
              </li>
            )
          })}
        </ul>
      </Popup>
    </Marker>
  )
}
