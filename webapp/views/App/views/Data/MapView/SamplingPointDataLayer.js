import React, { useEffect, useRef, useState } from 'react'
import { Circle, LayerGroup, LayersControl } from 'react-leaflet'

import * as Survey from '@core/survey/survey'
import * as PromiseUtils from '@core/promiseUtils'

import { useIsMounted } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'

import { useSurvey } from '@webapp/store/survey'

const itemsPageSize = 1000

export const SamplingPointDataLayer = (props) => {
  const { levelIndex } = props

  const isMountedRef = useIsMounted()
  const fetchCancel = useRef(null)
  const [items, setItems] = useState([])
  const survey = useSurvey()

  const surveyId = Survey.getId(survey)

  useEffect(() => {
    ;(async () => {
      const { request: countRequest, cancel: countCancel } = API.countSamplingPointData({ surveyId, levelIndex })

      fetchCancel.current = countCancel

      const {
        data: { count },
      } = await countRequest

      fetchCancel.current = null

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

          fetchCancel.current = itemsFetchCancel

          const {
            data: { items: itemsFetchedCurrent },
          } = await itemsRequest

          itemsFetched.push(...itemsFetchedCurrent)

          fetchCancel.current = null
        }
      })
      setItems(itemsFetched)
    })()

    return () => {
      if (fetchCancel.current) {
        fetchCancel.current()
      }
    }
  }, [])

  if (items.length === 0) return null

  return (
    <LayersControl.Overlay checked name="Sampling point data">
      <LayerGroup>
        {items.map((item) => (
          <Circle center={item.location} pathOptions={{ fillColor: 'blue' }} radius={200} />
        ))}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
