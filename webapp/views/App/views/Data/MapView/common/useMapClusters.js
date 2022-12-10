import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import useSupercluster from 'use-supercluster'

import { Objects } from '@openforis/arena-core'

import { Colors } from '@webapp/utils/colors'

const clusterRadius = 100
const clusterMaxZoom = 17
const initialZoom = 12

export const useMapClusters = (props) => {
  const { points } = props

  const map = useMap()

  const [state, setState] = useState({ bounds: null, zoom: initialZoom })

  const { bounds, zoom } = state

  const clusterIconsCacheRef = useRef({})

  const clusterIconCreator = useCallback(
    ({ count, size, color }) => {
      const clusterIconsCache = clusterIconsCacheRef.current
      if (!clusterIconsCache[count]) {
        const textColor = Colors.getHighContrastTextColor(color)

        clusterIconsCache[count] = L.divIcon({
          html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px; background-color: ${color}; color: ${textColor}">
        ${count}
      </div>`,
        })
      }
      return clusterIconsCache[count]
    },
    [clusterIconsCacheRef]
  )

  const updateState = useCallback(() => {
    const b = map.getBounds()
    const boundsNext = [b.getSouthWest().lng, b.getSouthWest().lat, b.getNorthEast().lng, b.getNorthEast().lat]
    const zoomNext = map.getZoom()
    if (zoom !== zoomNext || !Objects.isEqual(bounds, boundsNext)) {
      setState({ bounds: boundsNext, zoom: zoomNext })
    }
  }, [bounds, map, zoom])

  const onMove = useCallback(() => {
    updateState()
  }, [updateState])

  useEffect(() => {
    updateState()
  }, [map, updateState])

  useEffect(() => {
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
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
      return isCluster ? supercluster.getLeaves(id) : []
    },
    [supercluster]
  )

  const clusterExpansionZoomExtractor = useCallback(
    (cluster) => supercluster.getClusterExpansionZoom(cluster.id),
    [supercluster]
  )

  return {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
  }
}
