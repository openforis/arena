import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'

import { PointFactory } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as PromiseUtils from '@core/promiseUtils'

import { useIsMountedRef } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useMapClusters, useMapLayerAdd } from '../common'

const itemsPageSize = 2000

const _convertItemsToPoints = (items) => {
  const bounds = latLngBounds() // keep track of the layer bounds to calculate its center and pan the map into it

  const points = items.map((item) => {
    const { codes: itemCodes, latLng, location, uuid: itemUuid, recordUuid } = item
    const [lat, long] = latLng
    const itemPoint = PointFactory.createInstance({ x: long, y: lat })

    bounds.extend([lat, long])

    return {
      type: 'Feature',
      properties: { cluster: false, itemUuid, itemCodes, itemPoint, key: itemUuid, location, recordUuid },
      geometry: {
        type: 'Point',
        coordinates: [long, lat],
      },
    }
  })

  return { points, bounds }
}

const _fetchItems = async ({ surveyId, levelIndex, fetchCancelRef, isMountedRef }) => {
  const { request: countRequest, cancel: countCancel } = API.countSamplingPointData({ surveyId, levelIndex })

  fetchCancelRef.current = countCancel

  const {
    data: { count },
  } = await countRequest

  fetchCancelRef.current = null

  // load items in pages
  const items = []
  const pagesCount = Math.ceil(count / itemsPageSize)
  await PromiseUtils.each([...Array(pagesCount).keys()], async (currentPage) => {
    if (isMountedRef.current) {
      const { request: itemsRequest, cancel: itemsFetchCancel } = API.fetchSamplingPointData({
        surveyId,
        levelIndex,
        limit: itemsPageSize,
        offset: currentPage * itemsPageSize,
      })

      fetchCancelRef.current = itemsFetchCancel

      const {
        data: { items: itemsFetchedCurrent },
      } = await itemsRequest

      items.push(...itemsFetchedCurrent)

      fetchCancelRef.current = null
    }
  })

  return items
}

export const useSamplingPointDataLayer = (props) => {
  const { levelIndex, markersColor } = props

  const i18n = useI18n()
  const isMountedRef = useIsMountedRef()
  const map = useMap()

  const fetchCancelRef = useRef(null)
  const [state, setState] = useState({
    loaded: false,
    loading: false,
    points: [],
    items: [],
  })
  const { loaded, loading, points, items } = state

  const survey = useSurvey()
  const surveyId = Survey.getId(survey)

  const overlayInnerName = i18n.t(
    loading ? 'mapView.samplingPointDataLayerNameLoading' : 'mapView.samplingPointDataLayerName',
    { levelIndex }
  )

  // add icon close to name
  const overlayName = `${overlayInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  useMapLayerAdd({
    layerName: overlayName,
    callback: () => {
      const shouldLoadItems = !loaded && !loading
      if (shouldLoadItems) {
        ;(async () => {
          const items = await _fetchItems({ surveyId, levelIndex, fetchCancelRef, isMountedRef })
          const { points, bounds } = _convertItemsToPoints(items)

          // pan map into layer bounds center
          if (map.getZoom() < 5) {
            map.panTo(bounds.getCenter())
          }

          setState((statePrev) => ({ ...statePrev, loaded: true, loading: false, points, items }))
        })()
      }
      setState((statePrev) => ({ ...statePrev, loading: shouldLoadItems }))
    },
  })

  // cancel items fetch (if any) on unmount
  useEffect(() => {
    return () => {
      if (fetchCancelRef.current) {
        fetchCancelRef.current()
      }
    }
  }, [])

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator, getClusterLeaves } = useMapClusters({ points })

  return {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    overlayName,
    totalPoints: points.length,
    items,
    points,
  }
}
