import React, { useEffect, useRef } from 'react'

import * as Survey from '@core/survey/survey'

import { useIsMounted } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'

import { useSurvey } from '@webapp/store/survey'

const itemsPageSize = 1000

export const SamplingPointDataLayer = (props) => {
  const { levelIndex } = props

  const isMountedRef = useIsMounted()
  const fetchCancel = useRef(null)
  const survey = useSurvey()

  const surveyId = Survey.getId(survey)

  useEffect(() => {
    ;(async () => {
      const samplingPointCategory = Survey.getCategoryByName(Survey.samplingPointDataCategoryName)(survey)
      if (samplingPointCategory) {
        const { request: countRequest, cancel: countCancel } = API.countSamplingPointData({ surveyId, levelIndex })

        fetchCancel.current = countCancel

        const {
          data: { count },
        } = await countRequest

        fetchCancel.current = null

        // load items in pages
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
              data: { items },
            } = await itemsRequest

            fetchCancel.current = null

            // TODO do something with items
          }
        })
      }
    })()

    return () => {
      if (fetchCancel.current) {
        fetchCancel.current()
      }
    }
  }, [])

  return null
}
