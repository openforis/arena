import React from 'react'
import { Marker } from 'react-leaflet'

export const ClusterMarker = (props) => {
  const { cluster, clusterExpansionZoomExtractor, clusterIconCreator, color } = props

  const [longitude, latitude] = cluster.geometry.coordinates
  const { point_count: pointCount } = cluster.properties

  return (
    <Marker
      key={`cluster-${cluster.id}`}
      position={[latitude, longitude]}
      icon={clusterIconCreator({ count: pointCount, size: 10 + (pointCount / points.length) * 40, color })}
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
