import { useCallback } from 'react'

// import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

import { getUrl } from './useFetchData'

const getBody = ({ cycle }) => ({
  cycle,
  filter: null, // TODO filter ? JSON.stringify(filter) : null,
})

export const useFetchCount = ({ setCount }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { post, reset } = usePost({ subscribe: setCount, throttle: 500 })

  return {
    fetchCount: useCallback(
      ({ query }) =>
        post({
          url: `${getUrl({ surveyId, query })}/count`,
          body: getBody({ cycle, query }),
        }),
      [cycle, surveyId, post]
    ),
    resetCount: useCallback(reset, [reset]),
  }
}
