import { useCallback } from 'react'

import { Query } from '@common/model/query'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { usePost } from '@webapp/components/hooks'

export const getUrl = ({ surveyId, query }) => `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`

const getBody = ({ cycle, offset, limit, query }) => ({
  cycle,
  nodeDefUuidCols: JSON.stringify(Query.getAttributeDefUuids(query)),
  offset,
  limit,
  filter: null, // TODO filter ? JSON.stringify(filter) : null,
  sort: JSON.stringify([]), // TODO DataSort.toHttpParams(sort),
  editMode: Query.isModeRawEdit(query),
})

export const useFetchData = ({ setData }) => {
  const surveyId = useSurveyId()
  const cycle = useSurveyCycleKey()
  const { post, reset } = usePost({ subscribe: setData, throttle: 500 })

  return {
    fetchData: useCallback(
      ({ offset, limit, query }) =>
        post({
          url: getUrl({ surveyId, query }),
          body: getBody({ cycle, query, limit, offset }),
        }),
      [cycle, surveyId, post]
    ),
    resetData: useCallback(reset, [reset]),
  }
}
