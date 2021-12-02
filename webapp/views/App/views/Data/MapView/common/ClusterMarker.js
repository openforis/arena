import React from 'react'
import { Marker, useMap } from 'react-leaflet'

const maxZoom = 17

export const ClusterMarker = (props) => {
  const { cluster, clusterExpansionZoomExtractor, clusterIconCreator, color, totalPoints } = props

  const map = useMap()

  const [longitude, latitude] = cluster.geometry.coordinates
  const { point_count: pointCount } = cluster.properties

  return (
    <Marker
      key={`cluster-${cluster.id}`}
      position={[latitude, longitude]}
      icon={clusterIconCreator({ count: pointCount, size: 10 + (pointCount / totalPoints) * 40, color })}
      eventHandlers={{
        click: () => {
          const expansionZoom = Math.min(clusterExpansionZoomExtractor(cluster), maxZoom)
          map.setView([latitude, longitude], expansionZoom, {
            animate: true,
          })
        },
      }}
    />
  )
}
