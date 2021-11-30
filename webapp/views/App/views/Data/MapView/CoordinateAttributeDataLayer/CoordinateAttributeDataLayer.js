import React from 'react'

import { Query } from '@common/model/query'

import * as NodeDef from '@core/survey/nodeDef'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useMapClusters, ClusterMarker } from '../common'
import { CircleMarker } from 'react-leaflet'

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef } = props

  const query = Query.create({ entityDefUuid: NodeDef.getParentUuid(attributeDef) })

  const { count, data, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData } = useDataQuery(
    { query }
  )
  useEffect(() => {}, [])

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters()

  return (
    <LayersControl.Overlay name={overlayName}>
      {clusters.map((cluster) => {
        // every cluster point has coordinates
        const [longitude, latitude] = cluster.geometry.coordinates
        // the point may be either a cluster or a sampling point item
        const { cluster: isCluster, point_count: pointCount, itemUuid, itemCodes } = cluster.properties

        // we have a cluster to render
        if (isCluster) {
          return (
            <ClusterMarker
              cluster={cluster}
              color={color}
              clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
              clusterIconCreator={clusterIconCreator}
            />
          )
        }
        // we have a single point to render
        return (
          <CircleMarker key={itemUuid} center={[latitude, longitude]} radius={markerRadius} color={color}>
            <SamplingPointDataItemPopup location={location} codes={itemCodes} />
          </CircleMarker>
        )
      })}
    </LayersControl.Overlay>
  )
}
