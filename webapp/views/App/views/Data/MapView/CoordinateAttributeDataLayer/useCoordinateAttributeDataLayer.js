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

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useWebSocket } from '@webapp/components/hooks'

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
    data: null,
    points: [],
    editedRecordQuery: Query.create(),
  })
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()
  const map = useMap()

  const nodeDefParent = Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey)

  const { query, data, points, editedRecordQuery } = state

  const {
    data: dataFetched,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query })

  const {
    data: dataEditedRecord,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query: editedRecordQuery })

  const layerInnerName = NodeDef.getLabel(attributeDef, lang)

  // add icon close to layer name
  const layerName = `${layerInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  // on layer add, create query and fetch data
  useMapLayerAdd({
    layerName,
    callback: () => {
      const query = Query.create({
        entityDefUuid: NodeDef.getUuid(nodeDefParent),
        attributeDefUuids: [NodeDef.getUuid(attributeDef)],
      })
      setState((statePrev) => ({ ...statePrev, query }))
    },
  })

  // when data has been loaded, convert fetched items to GEOJson points
  useEffect(() => {
    if (dataFetched === null) return

    const { points: _points, bounds } = _convertDataToPoints({ data: dataFetched, attributeDef, nodeDefParent, survey })

    setState((statePrev) => ({ ...statePrev, data: dataFetched, points: _points }))

    if (_points.length > 0) {
      // pan map into layer bounds center
      map.panTo(bounds.getCenter())
    }
  }, [dataFetched])

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  // listen to websocket nodesUpdate events to detect edited record updates
  useWebSocket({
    eventName: WebSocketEvents.nodesUpdate,
    eventHandler: useCallback(
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
              editedRecordQuery: Query.assocFilterRecordUuid(editingRecordUuid)(statePrev.query),
            }))
          }
        }
      },
      [setState, editingRecordUuid, query]
    ),
  })

  // when edited record data has been fetched, update points
  useEffect(() => {
    if (dataEditedRecord?.length > 0) {
      const dataTable = new TableDataNodeDef(survey, nodeDefParent)
      const parentEntityColumn = new ColumnNodeDef(dataTable, nodeDefParent)

      // replace data with updated data and recreate points and clusters
      const dataUpdated = []
      data.forEach((item) => {
        const itemRecordUuid = item[TableDataNodeDef.columnSet.recordUuid]
        let itemUpdated = item
        if (itemRecordUuid === editingRecordUuid) {
          const itemParentUuid = item[parentEntityColumn.name]
          const editedRecordItem = dataEditedRecord.find(
            (_editedRecordItem) => _editedRecordItem[parentEntityColumn.name] === itemParentUuid
          )
          if (editedRecordItem) {
            itemUpdated = editedRecordItem
          }
        }
        dataUpdated.push(itemUpdated)
      }, [])

      // convert data to points
      const { points: pointsUpdated } = _convertDataToPoints({
        data: dataUpdated,
        attributeDef,
        nodeDefParent,
        survey,
      })

      setState((statePrev) => ({
        ...statePrev,
        data: dataUpdated,
        points: pointsUpdated,
        // clear edited record data fetch query to allow fetching data again on record updates
        editedRecordQuery: Query.create(),
      }))
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
