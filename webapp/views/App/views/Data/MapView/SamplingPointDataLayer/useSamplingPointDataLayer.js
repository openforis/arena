import { useEffect, useRef, useState } from 'react'
import { useMapEvents } from 'react-leaflet'

import * as Survey from '@core/survey/survey'
import * as PromiseUtils from '@core/promiseUtils'

import { useIsMounted } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const itemsPageSize = 1000

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

  useMapEvents({
    overlayadd(event) {
      const { name } = event
      if (name === overlayName) {
        const shouldLoadItems = items.length === 0 && !loading
        if (shouldLoadItems) {
          ;(async () => loadItems())()
        }
        setState((statePrev) => ({ ...statePrev, checked: true, loading: shouldLoadItems }))
      }
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

  return { checked, items, overlayName }
}
