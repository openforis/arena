import React, { useCallback, useEffect, useState } from 'react'
import L from 'leaflet'
// import './ShowCrimes.css'
import useSupercluster from 'use-supercluster'
import { Marker, useMap } from 'react-leaflet'

const icons = {}
const fetchIcon = (count, size) => {
  if (!icons[count]) {
    icons[count] = L.divIcon({
      html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px;">
        ${count}
      </div>`,
    })
  }
  return icons[count]
}

export const SamplingPointDataClusters = (props) => {
  const { items } = props

  const maxZoom = 22
  const [bounds, setBounds] = useState(null)
  const [zoom, setZoom] = useState(12)
  const map = useMap()

  // get map bounds
  function updateMap() {
    const b = map.getBounds()
    setBounds([b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthEast().lat])
    setZoom(map.getZoom())
  }

  const onMove = useCallback(() => {
    updateMap()
  }, [map])

  useEffect(() => {
    updateMap()
  }, [map])

  useEffect(() => {
    map.on('move', onMove)
    return () => {
      map.off('move', onMove)
    }
  }, [map, onMove])

  const points = items.map((item) => {
    const { location, codes, id: itemId } = item
    const [longitude, latitude] = location
    return {
      type: 'Feature',
      properties: { cluster: false, itemId, codes },
      geometry: {
        type: 'Point',
        coordinates: [latitude, longitude],
      },
    }
  })

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 100, maxZoom: 17 },
  })

  return (
    <>
      {clusters.map((cluster) => {
        // every cluster point has coordinates
        const [longitude, latitude] = cluster.geometry.coordinates
        // the point may be either a cluster or a crime point
        const { cluster: isCluster, point_count: pointCount } = cluster.properties

        // we have a cluster to render
        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={fetchIcon(pointCount, 10 + (pointCount / points.length) * 40)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), maxZoom)
                  map.setView([latitude, longitude], expansionZoom, {
                    animate: true,
                  })
                },
              }}
            />
          )
        }

        // we have a single point (sampling point item) to render
        return <Marker key={`crime-${cluster.properties.itemId}`} position={[latitude, longitude]} />
      })}
    </>
  )
}
