import { useCallback } from 'react'
import axios from 'axios'

import * as A from '@core/arena'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { getUrl } from './useFetchData'

const initialState = { data: null, loading: false, loaded: false }

export const useFetchCount = ({ setCount }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()

  return {
    fetchCount: useCallback(
      async ({ query }) => {
        setCount({ ...initialState, loading: true })
        try {
          const { data } = await axios.post(`${getUrl({ surveyId, query })}/count`, {
            cycle,
            query: A.stringify(query),
          })
          setCount({ data, loading: false, loaded: true })
        } catch (e) {}
      },
      [cycle, surveyId, setCount]
    ),
    resetCount: useCallback(() => {
      setCount(initialState)
    }, [setCount]),
  }
}
