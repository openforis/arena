import React, { useCallback, useState } from 'react'
import { CircleMarker, LayerGroup, LayersControl } from 'react-leaflet'

import { Points } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapClusters, useMapLayerAdd, ClusterMarker } from '../common'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { PanelRight } from '@webapp/components'
import Record from '@webapp/components/survey/Record'

const markerRadius = 10

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor } = props

  const [state, setState] = useState({ query: Query.create(), showRecordPanel: false })
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()

  const nodeDefParent = Survey.getNodeDefParent(attributeDef)(survey)
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const { query, editingRecordUuid, editingParentUuid } = state

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

  const setEditingRecord = useCallback(
    (params) => {
      const { recordUuid, parentUuid } = params || {}
      setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid, editingParentUuid: parentUuid }))
    },
    [setState]
  )

  // convert data items to GEOJson points
  const points =
    data === null
      ? []
      : data
          .map((item) => {
            const location = item[attributeColumn.name]
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

            const recordUuid = item[TableDataNodeDef.columnSet.recordUuid]
            const parentUuid = item[parentEntityColumn.name]
            const key = `${recordUuid}-${parentUuid}`

            return {
              type: 'Feature',
              properties: { key, cluster: false, point, recordUuid, parentUuid, location },
              geometry: {
                type: 'Point',
                coordinates: [long, lat],
              },
            }
          })
          .filter(Boolean)

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  return (
    <>
      <LayersControl.Overlay name={layerName}>
        <LayerGroup>
          {clusters.map((cluster) => {
            // the point may be either a cluster or a node value point
            const { cluster: isCluster, key, recordUuid, parentUuid } = cluster.properties

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
                key={key}
                center={[latitude, longitude]}
                radius={markerRadius}
                color={markersColor}
                fillColor={markersColor}
                fillOpacity={0.5}
              >
                <CoordinateAttributePopUp
                  recordUuid={recordUuid}
                  parentUuid={parentUuid}
                  onEditClick={() => setEditingRecord({ recordUuid, parentUuid })}
                />
              </CircleMarker>
            )
          })}
        </LayerGroup>
      </LayersControl.Overlay>
      {editingRecordUuid && (
        <PanelRight className="record-panel" width="70vw" onClose={() => setEditingRecord(null)}>
          <Record recordUuid={editingRecordUuid} pageNodeUuid={editingParentUuid} />
        </PanelRight>
      )}
    </>
  )
}
