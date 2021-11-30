import React from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'

import { Query } from '@common/model/query'

import * as NodeDef from '@core/survey/nodeDef'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapClusters, ClusterMarker } from '../common'
import { CircleMarker } from 'react-leaflet'

const markerRadius = 10

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef } = props

  const lang = useSurveyPreferredLang()

  const query = Query.create({ entityDefUuid: NodeDef.getParentUuid(attributeDef) })

  const { count, data, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData } = useDataQuery(
    { query }
  )

  const points = []
  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  return (
    <LayersControl.Overlay name={NodeDef.getLabel(attributeDef, lang)}>
      <LayerGroup>
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
              totalPoints={points.length}
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
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
