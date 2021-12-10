import { useCallback, useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'

import { Points } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import { ColumnNodeDef, TableDataNodeDef } from '@common/model/db'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import * as AppWebSocket from '@webapp/app/appWebSocket'
import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapClusters, useMapLayerAdd } from '../common'

const _convertDataToPoints = ({ data, attributeDef, nodeDefParent, survey }) => {
  const dataTable = new TableDataNodeDef(survey, nodeDefParent)
  const attributeColumn = new ColumnNodeDef(dataTable, attributeDef)
  const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

  const bounds = latLngBounds() // keep track of the layer bounds to calculate its center and pan the map into it

  const points = data
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

      bounds.extend([lat, long])

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

  return { points, bounds }
}

export const useCoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, editingRecordUuid } = props

  const [state, setState] = useState({
    query: Query.create(),
    showRecordPanel: false,
    points: [],
    editedRecordQuery: Query.create(),
  })
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()
  const map = useMap()

  const nodeDefParent = Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey)

  const { query, points, editedRecordQuery } = state

  const {
    data,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query })

  const {
    data: dataEditedRecord,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query: editedRecordQuery })

  const layerInnerName = NodeDef.getLabel(attributeDef, lang)

  // add icon close to layer name
  const layerName = `${layerInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  useMapLayerAdd({
    layerName,
    callback: () => {
      let query = Query.create({ entityDefUuid: NodeDef.getUuid(nodeDefParent) })
      query = Query.assocAttributeDefUuids([NodeDef.getUuid(attributeDef)])(query)
      setState((statePrev) => ({ ...statePrev, query }))
    },
  })

  // when data has been loaded, convert fetched items to GEOJson points
  useEffect(() => {
    if (data === null) return

    const { points: _points, bounds } = _convertDataToPoints({ data, attributeDef, nodeDefParent, survey })

    setState((statePrev) => ({ ...statePrev, points: _points }))

    if (_points.length > 0) {
      // pan map into layer bounds center
      map.panTo(bounds.getCenter())
    }
  }, [data])

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  const onNodesUpdate = useCallback(
    (nodesUpdated) => {
      if (editingRecordUuid) {
        const attributesChanged = Object.values(nodesUpdated).some(
          (nodeUpdated) =>
            Node.getRecordUuid(nodeUpdated) === editingRecordUuid &&
            Node.getNodeDefUuid(nodeUpdated) === NodeDef.getUuid(attributeDef)
        )
        if (attributesChanged) {
          setState((statePrev) => ({
            ...statePrev,
            editedRecordQuery: Query.assocFilterRecordUuid(editingRecordUuid)(query),
          }))
        }
      }
    },
    [editingRecordUuid]
  )

  useEffect(() => {
    AppWebSocket.on(WebSocketEvents.nodesUpdate, onNodesUpdate)

    return () => {
      AppWebSocket.off(WebSocketEvents.nodesUpdate, onNodesUpdate)
    }
  }, [onNodesUpdate])

  useEffect(() => {
    if (dataEditedRecord?.length > 0) {
      // replace data with updated data and recreate points and clusters
    }
  }, [dataEditedRecord])

  return {
    layerName,
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    totalPoints: points.length,
  }
}
