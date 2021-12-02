import { useEffect, useRef, useState } from 'react'

import { PointFactory } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as PromiseUtils from '@core/promiseUtils'

import { useIsMounted } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useMapClusters, useMapLayerAdd } from '../common'

const itemsPageSize = 2000

export const useSamplingPointDataLayer = (props) => {
  const { levelIndex, markersColor } = props

  const i18n = useI18n()
  const isMountedRef = useIsMounted()

  const fetchCancelRef = useRef(null)
  const [state, setState] = useState({ checked: false, loading: false, items: [] })
  const { checked, loading, items } = state
  const survey = useSurvey()

  const overlayInnerName = i18n.t(
    loading ? 'mapView.samplingPointDataLayerNameLoading' : 'mapView.samplingPointDataLayerName',
    { levelIndex }
  )

  // add icon close to name
  const overlayName = `${overlayInnerName}<div class='layer-icon' style="border-color: ${markersColor}" />`

  const loadItems = async () => {
    const { request: countRequest, cancel: countCancel } = API.countSamplingPointData({ surveyId, levelIndex })

    fetchCancelRef.current = countCancel

    const {
      data: { count },
    } = await countRequest

    fetchCancelRef.current = null

    // load items in pages
    const itemsFetched = []
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

        itemsFetched.push(...itemsFetchedCurrent)

        fetchCancelRef.current = null
      }
    })
    setState((statePrev) => ({ ...statePrev, loading: false, items: itemsFetched }))
  }

  useMapLayerAdd({
    layerName: overlayName,
    callback: () => {
      const shouldLoadItems = items.length === 0 && !loading
      if (shouldLoadItems) {
        ;(async () => loadItems())()
      }
      setState((statePrev) => ({ ...statePrev, checked: true, loading: shouldLoadItems }))
    },
  })

  const surveyId = Survey.getId(survey)

  useEffect(() => {
    return () => {
      if (fetchCancelRef.current) {
        fetchCancelRef.current()
      }
    }
  }, [])

  // convert items to GEOJson points
  const points = items.map((item) => {
    const { codes: itemCodes, latLng, location, uuid: itemUuid } = item
    const [lat, long] = latLng
    const itemPoint = PointFactory.createInstance({ x: long, y: lat, srs: '4326' })

    return {
      type: 'Feature',
      properties: { cluster: false, itemUuid, itemCodes, itemPoint, location },
      geometry: {
        type: 'Point',
        coordinates: [long, lat],
      },
    }
  })

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator } = useMapClusters({ points })

  return {
    checked,
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    items,
    overlayName,
    totalPoints: points.length,
  }
}
