import { useCallback, useEffect, useRef } from 'react'
import axios from 'axios'

import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

export const throttleTime = 250
export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

const initialState = { data: null, loading: false, loaded: false, error: false }

/**
 * Keeps track of the last started request, allowing to abort it when a new one is started or when the component is unmounted.
 * @returns {object} - An object with a `start` function (returning the AbortController of the new request)
 * and an `abort` function (aborting the last started request, if any).
 */
export const useAbortableRequest = () => {
  const abortControllerRef = useRef(null)

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  const start = useCallback(() => {
    abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    return abortController
  }, [abort])

  // abort pending request on unmount
  useEffect(() => abort, [abort])

  return { start, abort }
}

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { start: startRequest, abort: abortRequest } = useAbortableRequest()

  return {
    fetchData: useCallback(
      async ({ offset, limit, query }) => {
        // abort previous (now outdated) request, if any
        const abortController = startRequest()
        const { signal } = abortController
        setData((dataPrev) => ({ ...dataPrev, loading: true, loaded: false, error: false }))
        try {
          const { data } = await axios.post(getUrl({ surveyId, query }), { cycle, query, limit, offset }, { signal })
          if (!signal.aborted) setData({ data, loading: false, loaded: true })
        } catch (e) {
          if (!signal.aborted && !axios.isCancel(e)) setData({ data: null, loading: false, loaded: true, error: true })
        }
      },
      [cycle, surveyId, setData, startRequest]
    ),
    resetData: useCallback(() => {
      abortRequest()
      setData(initialState)
    }, [abortRequest, setData]),
  }
}
