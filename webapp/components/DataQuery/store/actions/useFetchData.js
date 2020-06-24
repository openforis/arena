import { useCallback } from 'react'

import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

const getBody = ({ cycle, offset, limit, query }) => ({
  cycle,
  nodeDefUuidCols: JSON.stringify(Query.getAttributeDefUuids(query)),
  offset,
  limit,
  filter: null, // filter ? JSON.stringify(filter) : null,
  sort: JSON.stringify([]), // DataSort.toHttpParams(sort),
  editMode: Query.isModeRawEdit(query),
})

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const post = usePost({ subscribe: setData, throttle: 400 })

  return useCallback(
    ({ offset, limit, query }) =>
      post.next({
        url: getUrl({ surveyId, query }),
        body: getBody({ cycle, query, limit, offset }),
      }),
    [cycle, surveyId, post]
  )
}
