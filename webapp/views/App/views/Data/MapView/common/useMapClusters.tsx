import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import Supercluster from 'supercluster'

import { Objects } from '@openforis/arena-core'

import { Colors } from '@webapp/utils/colors'

import type {
  ClusterIconCreator,
  MapClusterFeature,
  MapClusterOrPointFeature,
  MapPointFeature,
  MapPointProperties,
} from './mapPointTypes'

const clusterRadius = 100
const clusterMaxZoom = 17
const initialZoom = 12
const leavesLimit = 100

export const useMapClusters = <P extends MapPointProperties>(props: { points: MapPointFeature<P>[] }) => {
  const { points } = props

  const map = useMap()

  const [state, setState] = useState<{ bounds: [number, number, number, number] | null; zoom: number }>({
    bounds: null,
    zoom: initialZoom,
  })

  const { bounds, zoom } = state

  const clusterIconsCacheRef = useRef<Record<string, L.DivIcon>>({})

  const clusterIconCreator: ClusterIconCreator = useCallback(
    ({ count, size, color }) => {
      const clusterIconsCache = clusterIconsCacheRef.current
      const cacheKey = `${count}-${Math.round(size)}-${color}`
      if (!clusterIconsCache[cacheKey]) {
        const textColor = Colors.getHighContrastTextColor(color)

        clusterIconsCache[cacheKey] = L.divIcon({
          html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px; background-color: ${color}; color: ${textColor}">
        ${count}
      </div>`,
        })
      }
      return clusterIconsCache[cacheKey]
    },
    [clusterIconsCacheRef]
  )

  const updateState = useCallback(() => {
    const b = map.getBounds()
    const boundsNext: [number, number, number, number] = [
      b.getSouthWest().lng,
      b.getSouthWest().lat,
      b.getNorthEast().lng,
      b.getNorthEast().lat,
    ]
    const zoomNext = map.getZoom()
    if (zoom !== zoomNext || !Objects.isEqual(bounds, boundsNext)) {
      setState({ bounds: boundsNext, zoom: zoomNext })
    }
  }, [bounds, map, zoom])

  const onMove = useCallback(() => {
    updateState()
  }, [updateState])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bounds and zoom are read from the leaflet map
    updateState()
  }, [map, updateState])

  useEffect(() => {
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
    }
  }, [map, onMove])

  // index built only when the points change (use-supercluster rebuilt it on every map move)
  const supercluster = useMemo(() => {
    const index = new Supercluster<P>({ radius: clusterRadius, maxZoom: clusterMaxZoom })
    index.load(points)
    return index
  }, [points])

  const clusters = useMemo(
    (): MapClusterOrPointFeature<P>[] => (bounds ? supercluster.getClusters(bounds, Math.round(zoom)) : []),
    [bounds, supercluster, zoom]
  )

  const getClusterLeaves = useCallback(
    (cluster: MapClusterFeature): MapPointFeature<P>[] =>
      supercluster.getLeaves(cluster.properties.cluster_id, leavesLimit),
    [supercluster]
  )

  const clusterExpansionZoomExtractor = useCallback(
    (cluster: MapClusterFeature): number => supercluster.getClusterExpansionZoom(cluster.properties.cluster_id),
    [supercluster]
  )

  return {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
  }
}
