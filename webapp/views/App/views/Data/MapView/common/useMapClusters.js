import { useCallback, useEffect, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import useSupercluster from 'use-supercluster'

import { Colors } from '@webapp/utils/colors'

const clusterRadius = 100
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
      const textColor = Colors.getHighContrastTextColor(color)

      _clusterIconsCache[count] = L.divIcon({
        html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px; background-color: ${color}; color: ${textColor}">
        ${count}
      </div>`,
      })
    }
    return _clusterIconsCache[count]
  }

  const updateState = useCallback(() => {
    const b = map.getBounds()
    setState({
      bounds: [b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthEast().lat],
      zoom: map.getZoom(),
    })
  }, [map])

  const onMove = useCallback(() => {
    updateState()
  }, [updateState])

  useEffect(() => {
    updateState()
  }, [map, updateState])

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

  const getClusterLeaves = useCallback(
    (cluster) => {
      const { id, properties } = cluster
      const { cluster: isCluster } = properties
      if (isCluster) {
        return supercluster.getLeaves(id)
      }
      return []
    },
    [supercluster]
  )

  const clusterExpansionZoomExtractor = (cluster) => supercluster.getClusterExpansionZoom(cluster.id)

  return {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
  }
}
