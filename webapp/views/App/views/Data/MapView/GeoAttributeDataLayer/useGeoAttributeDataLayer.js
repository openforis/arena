import { useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-leaflet'

import { Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useDataQuery } from '@webapp/components/DataQuery/store'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useMapClusters, useMapLayerAdd } from '../common'
import { convertDataToGeoJsonPoints } from './convertDataToGeoJsonPoints'
import { useOnEditedRecordDataFetched } from './useOnEditedRecordDataFetched'

export const useGeoAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, editingRecordUuid } = props

  const [state, setState] = useState({
    query: Query.create(),
    data: null,
    editedRecordQuery: Query.create(),
    points: [],
    pointIndexByDataIndex: [],
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

  const { editedRecordQuery, points, query } = state

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
    [attributeDef, dataFetchedTemp]
  )

  // when data has been loaded, convert fetched items to GEOJson points
  useEffect(() => {
    if (!dataFetched) return

    const {
      bounds,
      pointIndexByDataIndex: _pointIndexByDataIndex,
      points: _points,
    } = convertDataToGeoJsonPoints({
      data: dataFetched,
      attributeDef,
      nodeDefParent,
      survey,
      i18n,
    })

    setState((statePrev) => ({
      ...statePrev,
      data: dataFetched,
      pointIndexByDataIndex: _pointIndexByDataIndex,
      points: _points,
    }))

    if (_points.length > 0 && map.getZoom() < 5) {
      // pan map into layer bounds center
      map.panTo(bounds.getCenter())
    }
  }, [attributeDef, dataFetched, i18n, map, nodeDefParent, survey])

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
