import { useCallback } from 'react'
import axios from 'axios'

import { Query } from '@common/model/query'

import * as A from '@core/arena'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

export const throttleTime = 250
export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

const initialState = { data: null, loading: false, loaded: false, error: false }

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  return {
    fetchData: useCallback(
      async ({ offset, limit, query }) => {
        setData((dataPrev) => ({ ...dataPrev, loading: true, loaded: false, error: false }))
        try {
          const { data } = await axios.post(getUrl({ surveyId, query }), {
            cycle,
            query: A.stringify(query),
            limit,
            offset,
          })
          setData({ data, loading: false, loaded: true })
        } catch (e) {
          setData({ data: null, loading: false, loaded: true, error: true })
        }
      },
      [cycle, surveyId, setData]
    ),
    resetData: useCallback(() => {
      setData(initialState)
    }, [setData]),
  }
}
