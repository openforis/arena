import { useCallback } from 'react'

import * as A from '@core/arena'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

import { getUrl, throttleTime } from './useFetchData'

export const useFetchCount = ({ setCount }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { post, reset } = usePost({ subscribe: setCount, throttle: throttleTime })

  return {
    fetchCount: useCallback(
      ({ query }) =>
        post({
          url: `${getUrl({ surveyId, query })}/count`,
          body: { cycle, query: A.stringify(query) },
        }),
      [cycle, surveyId, post]
    ),
    resetCount: useCallback(reset, [reset]),
  }
}
