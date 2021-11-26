import React, { useCallback, useEffect, useState } from 'react'
import L from 'leaflet'
// import './ShowCrimes.css'
import useSupercluster from 'use-supercluster'
import { CircleMarker, LayerGroup, Marker, Popup, useMap } from 'react-leaflet'

const clusterRadius = 150
const clusterMaxZoom = 17
const maxZoom = 22
const initialZoom = 12
const markerRadius = 10

const _clusterIconsCache = {}
const getOrCreateClusterIcon = (count, size) => {
  if (!_clusterIconsCache[count]) {
    _clusterIconsCache[count] = L.divIcon({
      html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px;">
        ${count}
      </div>`,
    })
  }
  return _clusterIconsCache[count]
}

export const SamplingPointDataClusters = (props) => {
  const { items } = props

  const [state, setState] = useState({ bounds: null, zoom: initialZoom })
  const map = useMap()

  const { bounds, zoom } = state

  // get map bounds
  const updateMap = () => {
    const b = map.getBounds()
    setState({
      bounds: [b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthEast().lat],
      zoom: map.getZoom(),
    })
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

  // convert items to GEOJson points
  const points = items.map((item) => {
    const { location, codes: itemCodes, uuid: itemUuid } = item
    const [lat, long] = location
    return {
      type: 'Feature',
      properties: { cluster: false, itemUuid, itemCodes },
      geometry: {
        type: 'Point',
        coordinates: [long, lat],
      },
    }
  })

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: clusterRadius, maxZoom: clusterMaxZoom },
  })

  return (
    <LayerGroup>
      {clusters.map((cluster) => {
        // every cluster point has coordinates
        const [longitude, latitude] = cluster.geometry.coordinates
        // the point may be either a cluster or a sampling point item
        const { cluster: isCluster, point_count: pointCount, itemUuid, itemCodes } = cluster.properties

        // we have a cluster to render
        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={getOrCreateClusterIcon(pointCount, 10 + (pointCount / points.length) * 40)}
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
        return (
          <CircleMarker key={itemUuid} center={[latitude, longitude]} radius={markerRadius}>
            <Popup>{itemCodes}</Popup>
          </CircleMarker>
        )
      })}
    </LayerGroup>
  )
}
