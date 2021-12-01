import React, { useState } from 'react'
import { CircleMarker, LayerGroup, LayersControl } from 'react-leaflet'

import { Points } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as NodeDef from '@core/survey/nodeDef'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapClusters, useMapLayerAdd, ClusterMarker } from '../common'

const markerRadius = 10

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor } = props

  const [state, setState] = useState({ query: Query.create() })
  const lang = useSurveyPreferredLang()

  const { query } = state

  const {
    data,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query })

  const layerInnerName = NodeDef.getLabel(attributeDef, lang)

  // add icon close to layer name
  const layerName = `${layerInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  useMapLayerAdd({
    layerName,
    callback: () => {
      let query = Query.create({ entityDefUuid: NodeDef.getParentUuid(attributeDef) })
      query = Query.assocAttributeDefUuids([NodeDef.getUuid(attributeDef)])(query)
      setState((statePrev) => ({ ...statePrev, query }))
    },
  })

  // convert data items to GEOJson points
  const points =
    data === null
      ? []
      : data
          .map((item) => {
            // TODO get value using data column name
            const location = item[NodeDef.getName(attributeDef)]
            if (!location) return null

            // workaraound: prepend SRID= to location if not specified
            const locationStr = location.startsWith('SRID=') ? location : `SRID=${location}`
            const point = Points.parse(locationStr)
            const pointLatLong = point ? Points.toLatLong(point) : null
            if (!pointLatLong) {
              // location is not valid, cannot convert it to lat-lon
              return null
            }

            const { x: long, y: lat } = pointLatLong
            const nodeUuid = null // TODO get it from the query

            return {
              type: 'Feature',
              properties: { cluster: false, point, location, nodeUuid },
              geometry: {
                type: 'Point',
                coordinates: [long, lat],
              },
            }
          })
          .filter(Boolean)

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a node value point
          const { cluster: isCluster, nodeUuid } = cluster.properties

          // we have a cluster to render
          if (isCluster) {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                color={markersColor}
                clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
                clusterIconCreator={clusterIconCreator}
                totalPoints={points.length}
              />
            )
          }
          const [longitude, latitude] = cluster.geometry.coordinates

          // we have a single point (node value) to render
          return (
            <CircleMarker
              key={nodeUuid}
              center={[latitude, longitude]}
              radius={markerRadius}
              color={markersColor}
              fillColor={markersColor}
              fillOpacity={0.5}
            ></CircleMarker>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
