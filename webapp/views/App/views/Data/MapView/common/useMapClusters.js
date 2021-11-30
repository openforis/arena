import { useCallback, useEffect, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import useSupercluster from 'use-supercluster'

const clusterRadius = 150
const clusterMaxZoom = 17
const initialZoom = 12

export const useMapClusters = (props) => {
  const { points } = props

  const map = useMap()

  const [state, setState] = useState({ bounds: null, zoom: initialZoom })

  const { bounds, zoom } = state

  const _clusterIconsCache = {}
  const clusterIconCreator = ({ count, size, color }) => {
    if (!_clusterIconsCache[count]) {
      _clusterIconsCache[count] = L.divIcon({
        html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px; background: ${color};">
        ${count}
      </div>`,
      })
    }
    return _clusterIconsCache[count]
  }

  const updateState = () => {
    const b = map.getBounds()
    setState({
      bounds: [b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthEast().lat],
      zoom: map.getZoom(),
    })
  }

  const onMove = useCallback(() => {
    updateState()
  }, [map])

  useEffect(() => {
    updateState()
  }, [map])

  useEffect(() => {
    map.on('move', onMove)
    return () => {
      map.off('move', onMove)
    }
  }, [map, onMove])

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: clusterRadius, maxZoom: clusterMaxZoom },
  })

  const clusterExpansionZoomExtractor = (cluster) => supercluster.getClusterExpansionZoom(cluster.id)

  return {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
  }
}
