import React from 'react'
import { CircleMarker, LayerGroup } from 'react-leaflet'

import { PointFactory } from '@openforis/arena-core'

import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataClusters = (props) => {
  const { items, color } = props

  // convert items to GEOJson points
  const points = items.map((item) => {
    const { codes: itemCodes, latLng, location, uuid: itemUuid } = item
    const [lat, long] = latLng
    const itemPoint = PointFactory.createInstance({ x: long, y: lat, srs: '4326' })

    return {
      type: 'Feature',
      properties: { cluster: false, itemUuid, itemCodes, itemPoint, location },
      geometry: {
        type: 'Point',
        coordinates: [long, lat],
      },
    }
  })

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  return (
    <LayerGroup>
      {clusters.map((cluster) => {
        // every cluster point has coordinates
        const [longitude, latitude] = cluster.geometry.coordinates
        // the point may be either a cluster or a sampling point item
        const { cluster: isCluster, point_count: pointCount, itemUuid, itemCodes, location } = cluster.properties

        // we have a cluster to render
        if (isCluster) {
          return (
            <ClusterMarker
              cluster={cluster}
              clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
              clusterIconCreator={clusterIconCreator}
              color={color}
            />
          )
        }

        // we have a single point (sampling point item) to render
        return (
          <CircleMarker key={itemUuid} center={[latitude, longitude]} radius={markerRadius} color={color}>
            <SamplingPointDataItemPopup location={location} codes={itemCodes} />
          </CircleMarker>
        )
      })}
    </LayerGroup>
  )
}
