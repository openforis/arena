import { useCallback, useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

import { Query } from '@common/model/query'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useWebSocket } from '@webapp/components/hooks'

import { useMapClusters, useMapLayerAdd } from '../common'
import { useOnEditedRecordDataFetched } from './useOnEditedRecordDataFetched'
import { convertDataToPoints } from './convertDataToPoints'

export const useCoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, editingRecordUuid } = props

  const [state, setState] = useState({
    query: Query.create(),
    data: null,
    points: [],
    pointIndexByDataIndex: [],
    editedRecordQuery: Query.create(),
  })
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const survey = useSurvey()
  const map = useMap()

  const nodeDefParent = Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey)
  const ancestorsKeyAttributes = Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey)

  const { query, points, editedRecordQuery } = state

  const layerInnerName = Survey.getNodeDefPath({
    nodeDef: attributeDef,
    showLabels: true,
    labelLang: lang,
    includeRootEntity: false,
  })(survey)

  // add icon close to layer name
  const layerName = `${layerInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  // on layer add, create query and fetch data
  useMapLayerAdd({
    layerName,
    callback: () => {
      const query = Query.create({
        entityDefUuid: NodeDef.getUuid(nodeDefParent),
        attributeDefUuids: [...ancestorsKeyAttributes.map(NodeDef.getUuid), NodeDef.getUuid(attributeDef)],
      })
      setState((statePrev) => ({ ...statePrev, query }))
    },
  })

  const {
    data: dataFetched,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query, limitData: false })

  // when data has been loaded, convert fetched items to GEOJson points
  useEffect(() => {
    if (dataFetched === null) return

    const {
      points: _points,
      pointIndexByDataIndex: _pointIndexByDataIndex,
      bounds,
    } = convertDataToPoints({ data: dataFetched, attributeDef, nodeDefParent, ancestorsKeyAttributes, survey, i18n })

    setState((statePrev) => ({
      ...statePrev,
      data: dataFetched,
      points: _points,
      pointIndexByDataIndex: _pointIndexByDataIndex,
    }))

    if (_points.length > 0 && map.getZoom() < 5) {
      // pan map into layer bounds center
      map.panTo(bounds.getCenter())
    }
  }, [dataFetched])

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

  // fetch record data on edited record query updates
  const { data: dataEditedRecord } = useDataQuery({ query: editedRecordQuery })

  useOnEditedRecordDataFetched({
    survey,
    attributeDef,
    nodeDefParent,
    editingRecordUuid,
    dataEditedRecord,
    state,
    setState,
  })

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator, getClusterLeaves } = useMapClusters({
    points,
  })

  return {
    layerName,
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    totalPoints: points.length,
    points,
  }
}
