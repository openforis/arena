import { useCallback } from 'react'
import axios from 'axios'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { getUrl, useAbortableRequest } from './useFetchData'

const initialState = { data: null, loading: false, loaded: false, error: false }

export const useFetchCount = ({ setCount }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { start: startRequest, abort: abortRequest } = useAbortableRequest()

  return {
    fetchCount: useCallback(
      async ({ query }) => {
        // abort previous (now outdated) request, if any
        const abortController = startRequest()
        const { signal } = abortController
        setCount((prevCount) => ({ ...(prevCount ?? initialState), loading: true, loaded: false, error: false }))
        try {
          const { data } = await axios.post(`${getUrl({ surveyId, query })}/count`, { cycle, query }, { signal })
          if (!signal.aborted) setCount({ data, loading: false, loaded: true })
        } catch (e) {
          if (!signal.aborted && !axios.isCancel(e)) setCount({ loading: false, loaded: true, error: true })
        }
      },
      [cycle, surveyId, setCount, startRequest]
    ),
    resetCount: useCallback(() => {
      abortRequest()
      setCount(initialState)
    }, [abortRequest, setCount]),
  }
}
