import { useCallback } from 'react'

import * as A from '@core/arena'
import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

export const throttleTime = 250
export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { post, reset } = usePost({ subscribe: setData, throttle: throttleTime })

  return {
    fetchData: useCallback(
      ({ offset, limit, query }) =>
        post({
          url: getUrl({ surveyId, query }),
          body: { cycle, query: A.stringify(query), limit, offset },
        }),
      [cycle, surveyId, post]
    ),
    resetData: useCallback(reset, [reset]),
  }
}
