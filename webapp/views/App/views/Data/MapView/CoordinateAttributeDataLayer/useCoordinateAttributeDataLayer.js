import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-leaflet'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useOnWebSocketEvent } from '@webapp/components/hooks'

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

  const nodeDefParent = useMemo(
    () => Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey),
    [attributeDef, survey]
  )
  const ancestorsKeyAttributes = useMemo(
    () => Survey.getNodeDefAncestorsKeyAttributes(attributeDef)(survey),
    [attributeDef, survey]
  )

  const { query, points, editedRecordQuery } = state

  const layerInnerName = useMemo(
    () =>
      Survey.getNodeDefPath({
        nodeDef: attributeDef,
        showLabels: true,
        labelLang: lang,
        includeRootEntity: false,
      })(survey),
    [attributeDef, lang, survey]
  )

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
    data: dataFetchedTemp,
    //  count, dataEmpty, dataLoaded, dataLoading, limit, offset, setLimit, setOffset, setData
  } = useDataQuery({ query, limitData: false })

  // exclude data with null coordinate values
  const dataFetched = useMemo(
    () => dataFetchedTemp?.filter((item) => !Objects.isEmpty(item[NodeDef.getName(attributeDef)])),
    [dataFetchedTemp]
  )

  // when data has been loaded, convert fetched items to GEOJson points
  useEffect(() => {
    if (!dataFetched) return

    const {
      points: _points,
      pointIndexByDataIndex: _pointIndexByDataIndex,
      bounds,
    } = convertDataToPoints({ data: dataFetched, attributeDef, nodeDefParent, survey, i18n })

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
  useOnWebSocketEvent({
    eventName: WebSocketEvents.nodesUpdate,
    eventHandler: useCallback(
      (nodesUpdated) => {
        if (editingRecordUuid) {
          const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
          const rootKeyDefsUuids = rootKeyDefs.map(NodeDef.getUuid)
          const shouldFetchRecordData = Object.values(nodesUpdated).some(
            (nodeUpdated) =>
              Node.getRecordUuid(nodeUpdated) === editingRecordUuid &&
              (Node.getNodeDefUuid(nodeUpdated) === NodeDef.getUuid(attributeDef) ||
                rootKeyDefsUuids.includes(Node.getNodeDefUuid(nodeUpdated)))
          )
          if (shouldFetchRecordData) {
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
